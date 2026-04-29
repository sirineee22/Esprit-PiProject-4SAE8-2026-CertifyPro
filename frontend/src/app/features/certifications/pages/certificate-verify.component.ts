import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface IssuedCertificateRecord {
  certId: string;
  learnerName: string;
  certificationTitle: string;
  issuedOn: string;
}

@Component({
  selector: 'app-certificate-verify',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="verify-page">
      <div class="verify-card" [class.invalid]="!isValid">
        <h1>{{ isValid ? 'Certificate Verified' : 'Certificate Not Verified' }}</h1>
        <p class="subtitle">
          {{ isValid
            ? 'This certificate exists in the verification registry.'
            : 'We could not verify this certificate ID in the current registry.' }}
        </p>

        <div class="details" *ngIf="record">
          <div><strong>Certificate ID:</strong> {{ record.certId }}</div>
          <div><strong>Learner:</strong> {{ record.learnerName }}</div>
          <div><strong>Certification:</strong> {{ record.certificationTitle }}</div>
          <div><strong>Issued On:</strong> {{ record.issuedOn }}</div>
        </div>

        <a routerLink="/certifications" class="back-link">Back to Certifications</a>
      </div>
    </div>
  `,
  styles: [`
    .verify-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: #f1f5f9;
    }
    .verify-card {
      width: 100%;
      max-width: 680px;
      background: #ffffff;
      border: 1px solid #d1fae5;
      border-left: 6px solid #10b981;
      border-radius: 14px;
      padding: 1.4rem;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    }
    .verify-card.invalid {
      border-color: #fecaca;
      border-left-color: #ef4444;
    }
    h1 {
      margin: 0 0 0.5rem 0;
      color: #0f172a;
      font-size: 1.4rem;
    }
    .subtitle {
      margin: 0 0 1rem 0;
      color: #64748b;
    }
    .details {
      background: #f8fafc;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      padding: 0.9rem;
      display: grid;
      gap: 0.45rem;
      margin-bottom: 1rem;
      color: #1e293b;
    }
    .back-link {
      display: inline-block;
      text-decoration: none;
      color: #2563eb;
      font-weight: 700;
    }
  `]
})
export class CertificateVerifyComponent implements OnInit {
  isValid = false;
  record: IssuedCertificateRecord | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const certId = (this.route.snapshot.queryParamMap.get('certId') || '').trim();
    const raw = localStorage.getItem('issued-certificates');
    const items: IssuedCertificateRecord[] = raw ? JSON.parse(raw) : [];
    this.record = items.find(i => i.certId === certId) || null;
    this.isValid = !!this.record;
  }
}
