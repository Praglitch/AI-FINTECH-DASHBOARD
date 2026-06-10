from django.db import models
# from pgvector.django import VectorField   # uncomment after pip install pgvector

class AnnouncementPdfCache(models.Model):
    newsid = models.CharField(max_length=100, unique=True)
    scripcode = models.CharField(max_length=50)
    attachment_url = models.TextField()
    pdf_text = models.TextField()
    processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['scripcode']),
            models.Index(fields=['newsid']),
        ]

    def __str__(self):
        return f"{self.scripcode} - {self.newsid}"

    def __repr__(self):
        return f"<AnnouncementPdfCache(scripcode={self.scripcode}, newsid={self.newsid})>"


class AnnouncementChunk(models.Model):
    pdf = models.ForeignKey(
        AnnouncementPdfCache,
        on_delete=models.CASCADE,
        related_name="chunks"
    )
    chunk_index = models.IntegerField()
    chunk_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    # embedding = VectorField(dimensions=384, null=True, blank=True)  # for pgvector

    class Meta:
        ordering = ['pdf', 'chunk_index']
        indexes = [
            models.Index(fields=['pdf', 'chunk_index']),
        ]

    def __str__(self):
        return f"{self.pdf.newsid} - Chunk {self.chunk_index}"

    def __repr__(self):
        return f"<AnnouncementChunk(newsid={self.pdf.newsid}, index={self.chunk_index})>"