import fitz
import requests
import tempfile


def extract_pdf_text_from_url(pdf_url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0 Safari/537.36",
            "Referer": "https://www.bseindia.com/",
            "Accept": "application/pdf,*/*",
            "Accept-Language": "en-US,en;q=0.9",
        }

        response = requests.get(
            pdf_url,
            headers=headers,
            allow_redirects=True,
            timeout=30
        )

        print("STATUS:", response.status_code)
        print("CONTENT TYPE:", response.headers.get("content-type"))

        response.raise_for_status()

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".pdf"
        ) as temp_pdf:
            temp_pdf.write(response.content)
            pdf_path = temp_pdf.name

        doc = fitz.open(pdf_path)

        text = ""

        for page in doc:
            text += page.get_text()

        doc.close()

        return text

    except Exception as e:
        print(f"PDF extraction error: {e}")
        return None