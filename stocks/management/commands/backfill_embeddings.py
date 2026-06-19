import os
import time
from django.core.management.base import BaseCommand
from stocks.models import AnnouncementChunk
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class Command(BaseCommand):
    help = "Generate OpenAI embeddings for all existing announcement chunks"

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Limit the number of chunks to process (for testing)',
        )

    def handle(self, *args, **options):
        queryset = AnnouncementChunk.objects.filter(embedding__isnull=True)
        
        if options['limit']:
            queryset = queryset[:options['limit']]

        total = queryset.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS("✅ No chunks need embedding. All done!"))
            return

        self.stdout.write(f"📊 Processing {total} chunks...")

        processed = 0
        errors = 0

        for chunk in queryset.iterator():
            try:
                response = client.embeddings.create(
                    model="text-embedding-3-small",
                    input=chunk.chunk_text[:8000]
                )
                chunk.embedding = response.data[0].embedding
                chunk.save()
                processed += 1

                if processed % 50 == 0:
                    self.stdout.write(f"  ↳ Processed {processed}/{total}")

                time.sleep(0.05)

            except Exception as e:
                errors += 1
                self.stdout.write(self.style.ERROR(f"❌ Error on chunk {chunk.id}: {e}"))

        self.stdout.write(self.style.SUCCESS(
            f"✅ Done! Processed: {processed}, Errors: {errors}, Total: {total}"
        ))
