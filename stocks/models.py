from django.db import models


class Stock(models.Model):
    symbol = models.CharField(max_length=20)
    open_price = models.FloatField()
    high_price = models.FloatField()
    low_price = models.FloatField()
    close_price = models.FloatField()

    def __str__(self):
        return self.symbol


# PDF Cache
class AnnouncementPdfCache(models.Model):
    newsid = models.CharField(max_length=100, unique=True)

    scripcode = models.CharField(max_length=50)

    attachment_url = models.TextField()

    pdf_text = models.TextField()

    processed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.scripcode} - {self.newsid}"


# PDF Chunks
class AnnouncementChunk(models.Model):
    pdf = models.ForeignKey(
        AnnouncementPdfCache,
        on_delete=models.CASCADE,
        related_name="chunks"
    )

    chunk_index = models.IntegerField()

    chunk_text = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.pdf.newsid} - Chunk {self.chunk_index}"