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
from .services.financial_service import get_company_financials_data
from .services.news_service import get_company_news_data
from .services.market_service import get_company_market_data
from .services.shareholding_service import get_company_shareholding_data
from .services.announcement_service import get_company_announcements_data




#LOGIN PAGE
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

        return render(
            request,
            "login.html",
            {"error": "Invalid username or password"}
        )

    return render(request, "login.html")


#HOME PAGE
@login_required
def home(request):
    return render(request, "home.html")






#SEARCH COMPANY
@login_required
def search_companies(request):

    query = request.GET.get("q", "")

    data = search_company_data(query)

    return JsonResponse(data, safe=False)





#COMPANY DETAILS
@login_required
def company_details(request, fincode):

    data = get_company_details_data(fincode)

    if not data:
        return JsonResponse(
            {"error": "Company not found"},
            status=404
        )

    return JsonResponse(data)
    
    
    
    
#COMPANY NEWS
@login_required
def company_news(request, fincode):

    news = get_company_news_data(fincode)

    return JsonResponse(news, safe=False)





#COMPANY FINANCIALS
@login_required
def company_financials(request, fincode):

    data = get_company_financials_data(fincode)

    if not data:
        return JsonResponse(
            {"error": "Financials not found"},
            status=404
        )

    return JsonResponse(data)
    
    
    
    
    
#COMPANY ANNOUNCEMENTS
@login_required
def company_announcements(request, fincode):

    announcements = get_company_announcements_data(fincode)

    if announcements is None:
        return JsonResponse(
            {"error": "Company not found"},
            status=404
        )

    return JsonResponse(
        announcements,
        safe=False
    )



#COMPANY MARKET SNAPSHOT
@login_required
def company_market(request, fincode):

    data = get_company_market_data(fincode)

    if not data:
        return JsonResponse(
            {"error": "Market data not found"},
            status=404
        )

    return JsonResponse(data)



#MCOMPANY SHAREHOLDING
@login_required
def company_shareholding(request, fincode):

    data = get_company_shareholding_data(fincode)

    if not data:
        return JsonResponse(
            {"error": "Shareholding data not found"},
            status=404
        )

    return JsonResponse(data)
    
    
    

#COMPANY CORPORATE ACTIONS
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
    
    
    
    
    
    
#COMPANY AI SUMMARY
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