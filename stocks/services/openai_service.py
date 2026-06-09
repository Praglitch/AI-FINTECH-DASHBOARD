from openai import OpenAI

from django.conf import settings

from stocks.services.ai_retrieval_service import build_context


client = OpenAI(
    api_key=settings.OPENAI_API_KEY
)


def ask_ai(question, fincode):
    """
    Build context and get AI response.
    """

    context = build_context(
        question,
        fincode
    )

    prompt = f"""
You are a financial research assistant.

Answer ONLY using the provided context.

If the answer is not present in the context,
say:
"I could not find that information in the available company data."

CONTEXT:

{context}

QUESTION:

{question}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a financial research assistant."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.2,
    )

    return response.choices[0].message.content