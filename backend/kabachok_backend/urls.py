from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
import os

def home(request):
    file_path = os.path.join(settings.STATIC_ROOT, 'index.html')
    with open(file_path, 'r') as f:
        return HttpResponse(f.read())

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('cases.urls')),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

urlpatterns += [re_path(r'^.*$', home)]