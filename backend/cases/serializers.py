from rest_framework import serializers
from .models import Case, Vegetable

class VegetableSerializer(serializers.ModelSerializer):
    rarity_display = serializers.CharField(source='get_rarity_display', read_only=True)
    
    class Meta:
        model = Vegetable
        fields = ['id', 'name', 'emoji', 'rarity', 'rarity_display', 'description', 'price']

class CaseSerializer(serializers.ModelSerializer):
    vegetables = VegetableSerializer(many=True, read_only=True)
    
    class Meta:
        model = Case
        fields = ['id', 'name', 'description', 'price', 'image_url', 'vegetables', 'is_active']