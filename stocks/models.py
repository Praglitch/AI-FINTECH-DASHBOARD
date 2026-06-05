from django.db import models

class Stock(models.Model):
    symbol = models.CharField(max_length=20)
    open_price = models.FloatField()
    high_price = models.FloatField()
    low_price = models.FloatField()
    close_price = models.FloatField()

    def __str__(self):
        return self.symbol
