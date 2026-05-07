import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  HttpClientTestingModule
} from '@angular/common/http/testing';

import { ForumService } from './forum.service';

describe('ForumService', () => {
  let service: ForumService;
  let httpMock: HttpTestingController;

  const api = 'http://localhost:8081/api/forum/posts';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(ForumService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get posts', () => {
    service.getPosts().subscribe(posts => {
      expect(posts.length).toBe(1);
      expect(posts[0].title).toBe('Post Test');
      expect(posts[0].reactionCount).toBe(0);
      expect(posts[0].commentCount).toBe(0);
    });

    const req = httpMock.expectOne(api);

    expect(req.request.method).toBe('GET');

    req.flush([
      {
        id: 1,
        title: 'Post Test',
        content: 'Content',
        userId: 1,
        comments: []
      }
    ]);
  });

  it('should delete post', () => {
    service.deletePost(1).subscribe();

    const req = httpMock.expectOne(`${api}/1`);

    expect(req.request.method).toBe('DELETE');

    req.flush({});
  });

  it('should create post', () => {
    const payload = {
      userId: 1,
      title: 'Hello',
      content: 'World'
    };

    service.createPost(payload).subscribe(response => {
      expect(response.title).toBe('Hello');
    });

    const req = httpMock.expectOne(api);

    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);

    req.flush({
      id: 1,
      title: 'Hello',
      content: 'World',
      userId: 1
    });
  });

  it('should update post', () => {
    service.updatePost(1, {
      title: 'Updated',
      content: 'Updated content'
    }).subscribe(response => {
      expect(response.title).toBe('Updated');
    });

    const req = httpMock.expectOne(`${api}/1`);

    expect(req.request.method).toBe('PUT');

    req.flush({
      id: 1,
      title: 'Updated',
      content: 'Updated content'
    });
  });

  it('should toggle reaction', () => {
    service.toggleReaction(1, 5).subscribe();

    const req = httpMock.expectOne(
      `${api}/1/react?userId=5`
    );

    expect(req.request.method).toBe('POST');

    req.flush({});
  });

  it('should add comment', () => {
    service.addComment(1, 5, 'Nice post').subscribe(comment => {
      expect(comment.content).toBe('Nice post');
    });

    const req = httpMock.expectOne(
      `${api}/1/comments?userId=5&content=Nice%20post`
    );

    expect(req.request.method).toBe('POST');

    req.flush({
      id: 1,
      content: 'Nice post'
    });
  });

  it('should delete comment', () => {
    service.deleteComment(10).subscribe();

    const req = httpMock.expectOne(
      `${api}/comments/10`
    );

    expect(req.request.method).toBe('DELETE');

    req.flush({});
  });

  it('should translate post', () => {
    service.translatePost(
      'Hello',
      'Content',
      'en',
      'fr'
    ).subscribe(response => {
      expect(response.title).toBe('Bonjour');
    });

    const req = httpMock.expectOne(
      `${api}/translate`
    );

    expect(req.request.method).toBe('POST');

    req.flush({
      title: 'Bonjour',
      content: 'Contenu'
    });
  });

  it('should generate AI post', () => {
    service.generatePostWithAi('fitness').subscribe(response => {
      expect(response.title).toBeTruthy();
    });

    const req = httpMock.expectOne(
      'http://localhost:8081/api/forum/posts/ai-generate'
    );

    expect(req.request.method).toBe('POST');

    req.flush({
      title: 'Generated Title',
      content: 'Generated Content'
    });
  });

  it('should return upload url', () => {
    const url = service.getUploadUrl('img.png');

    expect(url).toBe(
      'http://localhost:8081/uploads/posts/img.png'
    );
  });
});