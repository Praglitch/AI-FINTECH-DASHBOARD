import json
import requests
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .database.db_connection import get_connection
from .services.company_service import (
    search_company_data,
    get_company_details_data
)


def login_page(request):

    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is not None:
            login(request, user)
            return redirect("home")

    return render(request, "login.html")

@login_required
def home(request):
    return render(request, "home.html")


@login_required

def search_companies(request):

    query = request.GET.get("q", "")

    data = search_company_data(query)

    return JsonResponse(data, safe=False)


@login_required
def company_details(request, fincode):

    data = get_company_details_data(fincode)

    if not data:
        return JsonResponse(
            {"error": "Company not found"},
            status=404
        )

    return JsonResponse(data)
    
@login_required
def company_news(request, fincode):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            heading,
            date
        FROM news_master
        WHERE fincode = %s
        ORDER BY date DESC
        LIMIT 10
    """, [str(fincode)])

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    news = []

    for row in rows:
        news.append({
            "heading": row[0],
            "date": row[1].strftime("%d %b %Y")
        })

    return JsonResponse(news, safe=False)

@login_required
def company_financials(request, fincode):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            year_end,
            net_sales,
            operating_profit,
            profit_after_tax,
            reported_eps,
            dividend_perc
        FROM finance_cons_pl
        WHERE fincode = %s
        ORDER BY year_end DESC
        LIMIT 1
    """, [str(fincode)])

    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if not row:
        return JsonResponse(
            {"error": "Financials not found"},
            status=404
        )

    return JsonResponse({
        "year_end": row[0],
        "net_sales": row[1],
        "operating_profit": row[2],
        "profit_after_tax": row[3],
        "reported_eps": row[4],
        "dividend_perc": row[5]
    })
    
@login_required
def company_announcements(request, fincode):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT scripcode
        FROM company_master
        WHERE fincode = %s
        LIMIT 1
    """, [fincode])

    company = cursor.fetchone()

    if not company:
        cursor.close()
        conn.close()

        return JsonResponse(
            {"error": "Company not found"},
            status=404
        )

    scripcode = company[0]

    cursor.execute("""
        SELECT
            caption,
            datetime
        FROM bse_announcements
        WHERE scripcode = %s
        ORDER BY datetime DESC
        LIMIT 10
    """, [scripcode])

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    announcements = []

    for row in rows:
        announcements.append({
            "caption": row[0],
            "datetime": row[1].strftime("%d %b %Y %H:%M")
        })

    return JsonResponse(
        announcements,
        safe=False
    )
    
@login_required
def company_market(request, fincode):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            open,
            high,
            low,
            close,
            volume,
            value,
            month,
            year
        FROM monthlyprice
        WHERE fincode = %s
        ORDER BY year DESC, month DESC
        LIMIT 1
    """, [fincode])

    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if not row:
        return JsonResponse(
            {"error": "Market data not found"},
            status=404
        )

    return JsonResponse({
        "open": row[0],
        "high": row[1],
        "low": row[2],
        "close": row[3],
        "volume": row[4],
        "value": row[5],
        "month": row[6],
        "year": row[7]
    })
    
@login_required
def company_shareholding(request, fincode):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            date_end,
            tpftotalpromoter,
            tptotalpublic,
            tpinmfuti,
            tpinforeignportinv
        FROM shpsummary
        WHERE fincode = %s
        ORDER BY date_end DESC
        LIMIT 1
    """, [fincode])

    row = cursor.fetchone()

    cursor.close()
    conn.close()

    if not row:
        return JsonResponse(
            {"error": "Shareholding data not found"},
            status=404
        )

    return JsonResponse({
        "date_end": row[0],
        "promoter": row[1],
        "public": row[2],
        "mutual_fund": row[3],
        "fpi": row[4]
    })
@login_required   
def company_corporate_actions(request, fincode):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            sdate,
            details,
            amount,
            ratio1
        FROM corporate_actions_data
        WHERE fincode = %s
        ORDER BY sdate DESC
        LIMIT 10
    """, [fincode])

    rows = cur.fetchall()

    actions = []

    for row in rows:
        actions.append({
            "date": row[0].strftime("%d %b %Y") if row[0] else "",
            "details": row[1],
            "amount": row[2],
            "ratio": row[3]
        })

    cur.close()
    conn.close()

    return JsonResponse({
        "actions": actions
    })
 
 # TEMPORARY TEST ENDPOINT   
@login_required
def test_ollama(request):

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.2",
            "prompt": "Say hello in one sentence.",
            "stream": False
        }
    )

    data = response.json()

    return JsonResponse({
        "response": data["response"]
    })
    
@login_required
def company_ai_summary(request, fincode):

    company_response = company_details(request, fincode)
    financial_response = company_financials(request, fincode)
    shareholding_response = company_shareholding(request, fincode)
    market_response = company_market(request, fincode)

    company = json.loads(company_response.content)
    financials = json.loads(financial_response.content)
    shareholding = json.loads(shareholding_response.content)
    market = json.loads(market_response.content)

    prompt = f"""
    Analyze this company.

    Company: {company}

    Financials: {financials}

    Shareholding: {shareholding}

    Market Snapshot: {market}

    Give:
    1. Business Overview
    2. Strengths
    3. Risks
    4. Investor Takeaway

    Keep response under 200 words.
    """

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama3.2",
            "prompt": prompt,
            "stream": False
        }
    )

    data = response.json()

    return JsonResponse({
        "summary": data["response"]
    })