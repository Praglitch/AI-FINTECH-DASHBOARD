import json
import requests
import os
import re
import yfinance as yf
from django.utils import timezone
from openai import OpenAI
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .services.company_service import (
    search_company_data,
    get_company_details_data
)
from .services.financial_service import get_company_financials_data
from .services.news_service import get_company_news_data
from .services.market_service import get_company_market_data
from .services.shareholding_service import get_company_shareholding_data
from .services.announcement_service import get_company_announcements_data
from .services.corporate_actions_service import get_company_corporate_actions_data
from .services.yfinance_services import get_yfinance_data
from .services.ai_retrieval_service import build_context
from .models import PriceData




# LOGIN PAGE
def login_page(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect("home")
        return render(request, "login.html", {"error": "Invalid username or password"})
    return render(request, "login.html")


from django.contrib.auth.models import User
from django.shortcuts import render, redirect

def signup_page(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        first_name = request.POST.get('first_name')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        # Basic validation
        if password != confirm_password:
            return render(request, 'signup.html', {'error': 'Passwords do not match.'})

        if User.objects.filter(username=username).exists():
            return render(request, 'signup.html', {'error': 'Username already taken.'})

        if User.objects.filter(email=email).exists():
            return render(request, 'signup.html', {'error': 'Email already registered.'})

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name
        )
        user.save()
        return redirect('login')

    return render(request, 'signup.html')


# HOME PAGE
@login_required
def home(request):
    return render(request, "home.html")


# SEARCH COMPANY
@login_required
def search_companies(request):
    query = request.GET.get("q", "")
    data = search_company_data(query)
    return JsonResponse(data, safe=False)


# COMPANY DETAILS
@login_required
def company_details(request, fincode):
    data = get_company_details_data(fincode)
    if not data:
        return JsonResponse({"error": "Company not found", "available": False}, status=200)
    return JsonResponse({"data": data, "available": True}, status=200)


# COMPANY NEWS
@login_required
def company_news(request, fincode):
    news = get_company_news_data(fincode)
    if not news:
        return JsonResponse({"error": "No news available", "available": False}, status=200)
    return JsonResponse({"data": news, "available": True}, status=200)


# COMPANY FINANCIALS
@login_required
def company_financials(request, fincode):
    data = get_company_financials_data(fincode)
    if not data:
        return JsonResponse({"error": "Financial data not available", "available": False}, status=200)
    return JsonResponse({"data": data, "available": True}, status=200)


# COMPANY ANNOUNCEMENTS
@login_required
def company_announcements(request, fincode):
    announcements = get_company_announcements_data(fincode)
    if announcements is None:
        return JsonResponse({"error": "No announcements available", "available": False}, status=200)
    return JsonResponse({"data": announcements, "available": True}, status=200)


# COMPANY MARKET SNAPSHOT
@login_required
def company_market(request, fincode):
    data = get_company_market_data(fincode)
    if not data:
        return JsonResponse({"error": "Market data not available", "available": False}, status=200)
    return JsonResponse({"data": data, "available": True}, status=200)


# COMPANY SHAREHOLDING
@login_required
def company_shareholding(request, fincode):
    data = get_company_shareholding_data(fincode)
    if not data:
        return JsonResponse({"error": "Shareholding data not available", "available": False}, status=200)
    return JsonResponse({"data": data, "available": True}, status=200)


# COMPANY CORPORATE ACTIONS
@login_required
def company_corporate_actions(request, fincode):
    actions = get_company_corporate_actions_data(fincode)
    if not actions:
        return JsonResponse({"error": "No corporate actions available", "available": False, "actions": []}, status=200)
    return JsonResponse({"available": True, "actions": actions}, status=200)


# TEMPORARY TEST ENDPOINT
@login_required
def test_ollama(request):
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={"model": "tinyllama", "prompt": "Say hello in one sentence.", "stream": False}
    )
    data = response.json()
    return JsonResponse({"response": data["response"]})


# COMPANY AI SUMMARY - OLLAMA (DISABLED)
@login_required
def company_ai_summary(request, fincode):
    return JsonResponse({"summary": "Ollama is temporarily disabled. Please use OpenAI for company summaries."})


# COMPANY AI SUMMARY - OPENAI
@login_required
def company_openai_summary(request, fincode):
    company = get_company_details_data(fincode)
    financials = get_company_financials_data(fincode)
    shareholding = get_company_shareholding_data(fincode)
    market = get_company_market_data(fincode)

    prompt = f"""
    Analyze this company.

    Company: {company}
    Financials: {financials}
    Shareholding: {shareholding}
    Market: {market}

    Give:
    1. Business Overview
    2. Strengths
    3. Risks
    4. Investor Takeaway
    """

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return JsonResponse({"summary": response.choices[0].message.content})


# RAG COMPANY CHAT (SCOPED TO SELECTED COMPANY)
@login_required
@csrf_exempt
def company_chat(request, fincode):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=405)

    body = json.loads(request.body)
    question = body.get("question")
    history = body.get("history", [])

    context = build_context(question, fincode)

    history_text = ""
    for msg in history[-4:]:
        role = "User" if msg["role"] == "user" else "Assistant"
        history_text += f"{role}: {msg['content']}\n"

    prompt = f"""
Previous conversation:
{history_text if history_text else "(No previous conversation)"}

Current USER QUESTION:
{question}

CONTEXT (financials, market, shareholding, news, announcements, PDFs):
{context}

INSTRUCTIONS:
- If the current question is a follow‑up, answer concisely using context and history.
- Answer using **markdown** for readability.
- Use `**bold**` for numbers.
- Use bullet points (`-`) for lists.
- Use headings (`###`) for sections like "Financial Health", "Valuation", "Strengths & Risks", "Verdict".
"""

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": """
You are an Indian stock market analyst.

## Output Format:
- Use **markdown**: bold, bullet points, headings (`###`).
- Structure investment answers with sections: Financial Health, Valuation, Strengths & Risks, Verdict.

## Rules:
- Use only the provided context.
- Cite numbers in **bold**.
- For investment questions, give a balanced view with a disclaimer.
- For follow‑ups, be concise.
"""
            },
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )
    return JsonResponse({"answer": response.choices[0].message.content})


# STOCKSBOT – UNRESTRICTED CHAT (NEW)
@login_required
@csrf_exempt
def stocksbot_chat(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)

    try:
        body = json.loads(request.body)
        question = body.get("question", "").strip()
        history = body.get("history", [])
        provided_fincode = body.get("fincode", None)

        if not question:
            return JsonResponse({"error": "Question is required"}, status=400)

        is_etf_query = "etf" in question.lower()

        # ---- Helper: extract company name from a text ----
        def extract_company_from_text(text):
            # Remove common leading phrases
            cleaned = re.sub(r'^(tell me about|what about|how is|is|compare|explain|details of|information on|data for|give me info on|what are the|what is the|what is|what are)\s+', '', text, flags=re.IGNORECASE)
            cleaned = re.sub(r'[^\w\s]', '', cleaned)
            cleaned = re.sub(r"'s\b", '', cleaned)

            # Remove topic words and stopwords
            topic_words = ['risks', 'risk', 'performance', 'financials', 'shareholding', 'dividend', 'pe', 'ratio', 'news', 'announcements', 'company', 'stock', 'etf', 'fund', 'analysis', 'outlook', 'valuation']
            stopwords = ['of', 'for', 'on', 'the', 'and', 'is', 'are', 'what', 'how', 'why', 'when', 'which', 'who', 'whom', 'whose']

            words = cleaned.split()
            # Remove topic words and stopwords
            filtered = [w for w in words if w.lower() not in topic_words and w.lower() not in stopwords]
            query = ' '.join(filtered) if filtered else None

            # If nothing remains, try preposition-based extraction
            if not query or len(query) < 2:
                prepositions = ['in', 'of', 'for', 'about', 'on']
                for i, word in enumerate(words):
                    if word.lower() in prepositions and i + 1 < len(words):
                        after = ' '.join(words[i+1:])
                        after_words = after.split()
                        after_filtered = [w for w in after_words if w.lower() not in topic_words and w.lower() not in stopwords]
                        if after_filtered:
                            query = ' '.join(after_filtered)
                            break

            # If still nothing, take last 3 words (filtered)
            if not query or len(query) < 2:
                last_words = [w for w in reversed(words) if w.lower() not in topic_words and w.lower() not in stopwords][:3]
                if last_words:
                    query = ' '.join(reversed(last_words))
                else:
                    query = None

            return query

        # ---- If a specific fincode is provided (from clarification) ----
        if provided_fincode:
            fincode = provided_fincode
            company = get_company_details_data(fincode)
            if not company:
                return JsonResponse({"error": "Invalid company"}, status=404)
            company_name = company["compname"]
            # Store in a variable, not session
            current_company = (fincode, company_name)

        else:
            # ---- Try to extract company from the current question ----
            company_query = extract_company_from_text(question)

            # ---- If not found, look at previous user questions in history ----
            if not company_query or len(company_query) < 2:
                # Check history for previous user messages (reverse order)
                for msg in reversed(history):
                    if msg.get("role") == "user":
                        prev_query = extract_company_from_text(msg.get("content", ""))
                        if prev_query and len(prev_query) >= 2:
                            company_query = prev_query
                            break

            # ---- If still no company, ask user to specify ----
            if not company_query or len(company_query) < 2:
                return JsonResponse({
                    "answer": "I couldn't identify a company in your question. Could you please specify which company you're asking about? (e.g., 'Tell me about Reliance Industries' or 'What are the risks of Tata Steel?')",
                    "needs_clarification": False
                })

            # ---- Search for the company ----
            search_results = search_company_data(company_query)

            if not search_results:
                # Try each word individually
                parts = company_query.split()
                for part in parts:
                    if len(part) > 2:
                        search_results = search_company_data(part)
                        if search_results:
                            break

            if not search_results:
                return JsonResponse({
                    "answer": f"I couldn't find a company matching '{company_query}'. Could you please check the spelling or try a different name?",
                    "needs_clarification": False
                })

            from difflib import SequenceMatcher
            def similarity(a, b):
                return SequenceMatcher(None, a.lower(), b.lower()).ratio()

            for res in search_results:
                res['score'] = max(
                    similarity(res['compname'], company_query),
                    similarity(res['symbol'], company_query) if res['symbol'] else 0
                )

            search_results.sort(key=lambda x: x['score'], reverse=True)
            best_match = search_results[0]

            # ---- Clarification if multiple matches ----
            should_clarify = False
            if len(search_results) > 1:
                if best_match['score'] < 0.6 or len(company_query.split()) <= 2:
                    should_clarify = True
                if len(search_results) >= 2 and (search_results[0]['score'] - search_results[1]['score']) < 0.1:
                    should_clarify = True

            if should_clarify:
                options = []
                for r in search_results[:5]:
                    options.append({
                        "name": r["compname"],
                        "symbol": r["symbol"] or "N/A",
                        "fincode": r["fincode"]
                    })
                msg = "I found multiple companies matching your query. Which one did you mean?"
                if is_etf_query:
                    msg = "I don't have specific ETF data, but here are the companies I found. Please select one for detailed analysis:"
                return JsonResponse({
                    "needs_clarification": True,
                    "message": msg,
                    "options": options,
                    "is_etf_query": is_etf_query
                })

            fincode = best_match["fincode"]
            company_name = best_match["compname"]

        # ---- At this point we have fincode and company_name ----
        # (No session storage – we rely on history from the frontend)

        context = build_context(question, fincode)

        history_text = ""
        for msg in history[-4:]:
            role = "User" if msg["role"] == "user" else "Assistant"
            history_text += f"{role}: {msg['content']}\n"

        if is_etf_query:
            etf_note = "Note: The user asked about an ETF, but we don't have ETF-specific data. We are providing analysis for the selected company instead."
        else:
            etf_note = ""

        prompt = f"""
You are an Indian stock market analyst.

Previous conversation:
{history_text if history_text else "(No previous conversation)"}

Current USER QUESTION:
{question}

Company resolved: {company_name} (fincode: {fincode})

{etf_note}

CONTEXT (financials, market, shareholding, news, announcements, PDFs):
{context}

INSTRUCTIONS:
- Answer using **markdown** for readability.
- Use `**bold**` for numbers.
- Use bullet points (`-`) for lists.
- Use headings (`###`) for sections like "Financial Health", "Valuation", "Strengths & Risks", "Verdict".
- If the user asked about an ETF, clarify at the start that we don't have ETF data and this is the company analysis.
- If you don't know something, say so clearly.
"""

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """
You are an Indian stock market analyst.

## Output Format:
- Use **markdown**: bold, bullet points, headings (`###`).
- Structure investment answers with sections: Financial Health, Valuation, Strengths & Risks, Verdict.

## Rules:
- Use only the provided context.
- Cite numbers in **bold**.
- For investment questions, give a balanced view with a disclaimer.
- For follow‑ups, be concise.
"""
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        answer = response.choices[0].message.content

        return JsonResponse({"answer": answer, "resolved_company": company_name, "fincode": fincode})

    except Exception as e:
        print(f"StocksBot error: {e}")
        return JsonResponse({"error": f"Server error: {str(e)}"}, status=500)    
    
    
# YAHOO FINANCE DATA
@login_required
def company_yfinance(request, fincode):
    period = request.GET.get("period", "1y")
    interval = request.GET.get("interval", "1mo")
    data = get_yfinance_data(fincode, period, interval)
    if not data:
        return JsonResponse({"error": "No data available", "available": False}, status=200)
    return JsonResponse({"data": data, "available": True}, status=200)


@login_required
def default_companies(request):
    """Return top 10 companies (empty search) for watchlist and example chips."""
    from .services.company_service import search_company_data
    data = search_company_data('')
    return JsonResponse(data, safe=False)


@login_required
def tradingview_data(request, fincode):
    """Return OHLC data in TradingView format."""
    from .services.yfinance_services import get_yfinance_data
    from datetime import datetime
    period = request.GET.get('period', '1y')
    interval = request.GET.get('interval', '1D')
    data = get_yfinance_data(fincode, period, interval)
    if not data or not data.get('chart_data'):
        return JsonResponse({'s': 'error', 'errmsg': 'No data'})
    chart_data = data['chart_data']
    for item in chart_data:
        if ' ' in item['date']:
            dt = datetime.strptime(item['date'], '%Y-%m-%d %H:%M:%S')
        else:
            dt = datetime.strptime(item['date'], '%Y-%m-%d')
        item['time'] = int(dt.timestamp())
    return JsonResponse({'s': 'ok', 'data': chart_data})


# ---------- LIVE PRICE (YAHOO FINANCE) ----------
@login_required
def live_price(request, symbol):
    try:
        ticker = yf.Ticker(f"{symbol}.NS")
        data = ticker.history(period="1d")
        if data.empty:
            # Fallback to last available close
            hist = ticker.history(period="5d")
            if not hist.empty:
                last_close = hist['Close'].iloc[-1]
                return JsonResponse({
                    'symbol': symbol,
                    'price': round(last_close, 2),
                    'source': 'yahoo (last close)',
                    'fetched_at': timezone.now().isoformat()
                })
            return JsonResponse({'error': 'No data found'}, status=404)
        current_price = data['Close'].iloc[-1]
        return JsonResponse({
            'symbol': symbol,
            'price': round(current_price, 2),
            'open': round(data['Open'].iloc[-1], 2) if not data['Open'].empty else None,
            'high': round(data['High'].iloc[-1], 2) if not data['High'].empty else None,
            'low': round(data['Low'].iloc[-1], 2) if not data['Low'].empty else None,
            'volume': int(data['Volume'].iloc[-1]) if not data['Volume'].empty else None,
            'source': 'yahoo',
            'fetched_at': timezone.now().isoformat()
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ---------- PRICE DATA API ----------
@login_required
def price_data_api(request, symbol):
    """
    API endpoint to serve raw price data from the local PriceData table.
    Query params:
    - interval: '1m', '1d', etc. (default: '1m')
    - start: YYYY-MM-DD (optional)
    - end: YYYY-MM-DD (optional)
    - limit: number of latest candles (optional)
    """
    interval = request.GET.get('interval', '1m')
    start = request.GET.get('start')
    end = request.GET.get('end')
    limit = request.GET.get('limit')

    qs = PriceData.objects.filter(symbol=symbol, interval=interval)

    if start:
        qs = qs.filter(timestamp__date__gte=start)
    if end:
        qs = qs.filter(timestamp__date__lte=end)

    qs = qs.order_by('timestamp')

    if limit:
        qs = qs[:int(limit)]

    data = list(qs.values('timestamp', 'open', 'high', 'low', 'close', 'volume'))
    return JsonResponse(data, safe=False)


# LOGOUT
def logout_view(request):
    logout(request)
    return redirect('login')


# HELP PAGE
@login_required
def help_page(request):
    return render(request, 'help.html')

@login_required
def stocksbot_page(request):
    return render(request, 'stocksbot.html')