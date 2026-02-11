from django.contrib import admin
from .models import Case, Vegetable 

@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    filter_horizontal = ('vegetables',) 

@admin.register(Vegetable)
class VegetableAdmin(admin.ModelAdmin):
    list_display = ('name', 'emoji', 'rarity', 'price')
    list_filter = ('rarity',)
    search_fields = ('name', 'description')