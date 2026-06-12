"""
URL configuration for stockapp project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from stocks.views import help_page



from stocks.views import (
    login_page,
    home,
    search_companies,
    company_details,
    company_news,
    company_financials,
    company_announcements,
    company_market,
    company_shareholding,
    company_corporate_actions,
    test_ollama,
    company_ai_summary,
    company_openai_summary,
    company_yfinance,
    company_chat,
    logout_view,
    help_page
)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('', login_page, name='login'),

    path('home/', home, name='home'),
    
    path('logout/', logout_view, name='logout'),
    
    path('help/', help_page, name='help'),
    

    path(
        'search/',
        search_companies,
        name='search_companies'
    ),
    
    path(
    "company/<int:fincode>/",
    company_details,
    name="company_details"
),
    
    path(
    "company/<int:fincode>/news/",
    company_news,
    name="company_news"
),
    
    path(
    "company/<int:fincode>/financials/",
    company_financials,
    name="company_financials"
),
    
    path(
    "company/<int:fincode>/announcements/",
    company_announcements,
    name="company_announcements"
),
    
    path(
    "company-market/<int:fincode>/",
    company_market,
    name="company_market"
),
    
    path(
    "company-shareholding/<int:fincode>/",
    company_shareholding,
    name="company_shareholding"
),
    
    path(
    "company/<int:fincode>/corporate-actions/",
    company_corporate_actions,
    name="company_corporate_actions"
),
    
    path(
    "test-ollama/",
    test_ollama,
    name="test_ollama"
),
    
    path(
    "company/<int:fincode>/ai-summary/",
    company_ai_summary,
    name="company_ai_summary"
),
    
    
path(
    "company/<int:fincode>/openai-summary/",
    company_openai_summary,
),

path(
    "company/<int:fincode>/chat/",
    company_chat,
    name="company_chat"
),

path(
    "company/<int:fincode>/yfinance/",
    company_yfinance,
    name="company_yfinance"
),
]

