import json
from urllib import response
from xmlrpc import client
import requests
import os
from openai import OpenAI
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
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
from django.views.decorators.csrf import csrf_exempt
from .services.ai_retrieval_service import build_context


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






#COMPANY SHAREHOLDING
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

    actions = get_company_corporate_actions_data(fincode)

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
    
    
 
#COMPANY AI SUMMARY - OLLAMA
@login_required
def company_ai_summary(request, fincode):

    company = get_company_details_data(fincode)
    financials = get_company_financials_data(fincode)
    shareholding = get_company_shareholding_data(fincode)
    market = get_company_market_data(fincode)

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
    
    
    
#COMPANY AI SUMMARY - OPENAI
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

    from openai import OpenAI

    client = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY")
    )

    response = client.chat.completions.create(
        model="gpt-4o-mini",   # Correct model name
        messages=[
            {
                "role":"user",
                "content":prompt
            }
        ]
    )

    return JsonResponse({
        "summary":
        response.choices[0].message.content
    })
    
   
   
#RAG COMPANY CHAT   
@login_required
@csrf_exempt
def company_chat(request, fincode):
    
    if request.method != "POST":
        return JsonResponse({
        "error": "POST request required"
    }, status=405)

    body = json.loads(request.body)

    question = body.get("question")

    context = build_context(
    question,
    fincode
)
    
    prompt = f"""
    You are a financial analyst.

    Use only the provided information.

    Context:
    {context}

    Question:
    {question}

    Answer clearly.
    """
    
    client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

    response = client.chat.completions.create(
    model="gpt-4.1-mini",
   messages=[
    {
        "role": "system",
        "content": """
You are an Indian stock market analyst.

Rules:
1. Use only the supplied context.
2. Do not make up information.
3. If information is unavailable, say so.
4. Keep answers concise and factual.
"""
    },
    {
        "role": "user",
        "content": prompt
    }
]
    
)
    



    return JsonResponse({
        "answer": response.choices[0].message.content
})
    
    
    
    
#YAHOO FINANCE DATA
@login_required
def company_yfinance(request, fincode):

    data = get_yfinance_data(fincode)

    return JsonResponse(data)

