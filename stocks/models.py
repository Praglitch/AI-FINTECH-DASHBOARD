from django.db import models
from pgvector.django import VectorField

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
    embedding = VectorField(dimensions=1536, null=True, blank=True)

    class Meta:
        ordering = ['pdf', 'chunk_index']
        indexes = [
            models.Index(fields=['pdf', 'chunk_index']),
        ]

    def __str__(self):
        return f"{self.pdf.newsid} - Chunk {self.chunk_index}"


# ---------- NEW: Price Data for OHLCV caching ----------
class PriceData(models.Model):
    symbol = models.CharField(max_length=30, db_index=True)
    interval = models.CharField(max_length=5, db_index=True, default='1m')
    timestamp = models.DateTimeField(db_index=True)
    open = models.FloatField()
    high = models.FloatField()
    low = models.FloatField()
    close = models.FloatField()
    volume = models.BigIntegerField(default=0)

    class Meta:
        unique_together = ('symbol', 'interval', 'timestamp')
        indexes = [
            models.Index(fields=['symbol', 'interval', 'timestamp']),
        ]
        ordering = ['symbol', 'interval', 'timestamp']

    def __str__(self):
        return f"{self.symbol} ({self.interval}) - {self.timestamp}"
    
class LivePriceSnapshot(models.Model):
    symbol = models.CharField(max_length=50, unique=True)
    price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    volume = models.BigIntegerField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now=True, db_column='fetched_at')  # map to fetched_at
    source = models.CharField(max_length=20, default='upstox_ws')

    def __str__(self):
        return f"{self.symbol} @ {self.price} ({self.timestamp})"
    
    
class UpstoxToken(models.Model):
    access_token = models.CharField(max_length=500)
    refresh_token = models.CharField(max_length=500, null=True, blank=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Upstox Token (expires {self.expires_at})"
    
    
class InstrumentKeyMapping(models.Model):
    symbol = models.CharField(max_length=50, unique=True)
    upstox_key = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.symbol} → {self.upstox_key}"