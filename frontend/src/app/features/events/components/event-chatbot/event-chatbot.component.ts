import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewChecked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventsApiService } from '../../services/events.api';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

@Component({
  selector: 'app-event-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating Button -->
    <button class="chatbot-fab" (click)="toggleChat()" *ngIf="!isOpen" title="Ask AI Assistant">
      <i class="bi bi-robot"></i>
    </button>

    <!-- Chat Window -->
    <div class="chatbot-window" [class.open]="isOpen">
      <div class="chat-header">
        <div class="header-info">
          <div class="bot-avatar">
            <i class="bi bi-robot"></i>
          </div>
          <div>
            <h3>Event AI Assistant</h3>
            <span class="status">Online</span>
          </div>
        </div>
        <button class="close-btn" (click)="toggleChat()">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="chat-body" #chatBody>
        <div class="message" *ngFor="let msg of messages" [class.user]="msg.sender === 'user'" [class.bot]="msg.sender === 'bot'">
          <div class="message-content">
            <p>{{ msg.text }}</p>
            <span class="time">{{ msg.timestamp | date:'shortTime' }}</span>
          </div>
        </div>

        <div class="message bot typing" *ngIf="isTyping">
          <div class="message-content">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Suggested Questions -->
      <div class="suggested-questions" *ngIf="messages.length === 1 && !isTyping">
        <button *ngFor="let q of suggestedQuestions" (click)="sendSuggested(q)">
          {{ q }}
        </button>
      </div>

      <div class="chat-footer">
        <input 
          type="text" 
          [(ngModel)]="newMessage" 
          (keyup.enter)="sendMessage()"
          placeholder="Ask a question about this event..." 
          [disabled]="isTyping"
        />
        <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage.trim() || isTyping">
          <i class="bi bi-send-fill"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --chat-primary: #3b82f6;
      --chat-bg: #ffffff;
      --chat-text: #1e293b;
      --chat-muted: #94a3b8;
    }

    .chatbot-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border: none;
      box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
      cursor: pointer;
      font-size: 1.75rem;
      z-index: 99999;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chatbot-fab:hover {
      transform: scale(1.1);
    }

    .chatbot-window {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 380px;
      height: 600px;
      max-height: calc(100vh - 48px);
      background: var(--chat-bg);
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      z-index: 99999;
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    .chatbot-window.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }

    .chat-header {
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg, #0b1f3b, #1e293b);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .bot-avatar {
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .header-info h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
    }

    .status {
      font-size: 0.7rem;
      color: #93c5fd;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .status::before {
      content: '';
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: rgba(255,255,255,0.7);
      font-size: 1.25rem;
      cursor: pointer;
      transition: color 0.2s;
    }

    .close-btn:hover {
      color: white;
    }

    .chat-body {
      flex: 1;
      padding: 1.25rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: #f8fafc;
    }

    .message {
      display: flex;
      flex-direction: column;
      max-width: 85%;
    }

    .message.user {
      align-self: flex-end;
    }

    .message.bot {
      align-self: flex-start;
    }

    .message-content {
      padding: 0.75rem 1rem;
      border-radius: 12px;
      position: relative;
    }

    .message-content p {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.4;
      white-space: pre-wrap;
    }

    .message.user .message-content {
      background: var(--chat-primary);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message.bot .message-content {
      background: white;
      color: var(--chat-text);
      border-bottom-left-radius: 4px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 5px rgba(0,0,0,0.02);
    }

    .time {
      font-size: 0.65rem;
      margin-top: 4px;
      display: inline-block;
      opacity: 0.7;
    }

    .message.user .time { color: rgba(255,255,255,0.8); text-align: right; display: block; }
    .message.bot .time { color: var(--chat-muted); }

    .suggested-questions {
      padding: 0 1.25rem 1rem;
      background: #f8fafc;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .suggested-questions button {
      background: white;
      border: 1px solid #cbd5e1;
      padding: 0.5rem 0.75rem;
      border-radius: 100px;
      font-size: 0.8rem;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s;
    }

    .suggested-questions button:hover {
      background: #eff6ff;
      border-color: #93c5fd;
      color: #1d4ed8;
    }

    .chat-footer {
      padding: 1rem;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 0.5rem;
    }

    .chat-footer input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 100px;
      outline: none;
      font-size: 0.9rem;
      transition: border-color 0.2s;
    }

    .chat-footer input:focus {
      border-color: var(--chat-primary);
    }

    .send-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--chat-primary);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .send-btn:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
    }

    /* Typing Indicator */
    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 4px 2px;
    }

    .typing-indicator span {
      width: 6px;
      height: 6px;
      background: #94a3b8;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }

    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  `]
})
export class EventChatbotComponent implements OnInit, AfterViewChecked {
  @Input() eventId!: number;
  @Input() eventTitle: string = '';

  @ViewChild('chatBody') private chatBody!: ElementRef;
  private api = inject(EventsApiService);

  isOpen = false;
  isTyping = false;
  newMessage = '';
  
  messages: ChatMessage[] = [];

  suggestedQuestions = [
    "What is the schedule?",
    "Do I need to prepare anything?",
    "Who is the trainer?"
  ];

  ngOnInit() {
    console.log('EventChatbotComponent initialized for event:', this.eventTitle);
    this.messages.push({
      text: `Hello! I'm your AI assistant for "${this.eventTitle}". How can I help you today?`,
      sender: 'bot',
      timestamp: new Date()
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    console.log('Chatbot toggled. Current state:', this.isOpen);
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  sendSuggested(question: string) {
    this.newMessage = question;
    this.sendMessage();
  }

  sendMessage() {
    if (!this.newMessage.trim() || this.isTyping) return;

    const userText = this.newMessage.trim();
    
    this.messages.push({
      text: userText,
      sender: 'user',
      timestamp: new Date()
    });

    this.newMessage = '';
    this.isTyping = true;

    this.api.chat(this.eventId, userText).subscribe({
      next: (res) => {
        this.isTyping = false;
        this.messages.push({
          text: res.text,
          sender: 'bot',
          timestamp: new Date()
        });
      },
      error: (err) => {
        this.isTyping = false;
        this.messages.push({
          text: "Sorry, I'm currently unable to connect to the AI service. If you haven't set up the Gemini API key, please check the configuration.",
          sender: 'bot',
          timestamp: new Date()
        });
      }
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.chatBody) {
        this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
      }
    } catch(err) {}
  }
}
