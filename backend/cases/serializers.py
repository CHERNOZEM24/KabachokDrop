from rest_framework import serializers
from .models import Case, Vegetable, Profile, Inventory
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User

class VegetableSerializer(serializers.ModelSerializer):
    rarity_display = serializers.CharField(source='get_rarity_display', read_only=True)
    
    class Meta:
        model = Vegetable
        fields = ['id', 'name', 'emoji', 'rarity', 'rarity_display', 'description', 'price']

class ProfileSerializer(serializers.ModelSerializer):  
    class Meta:
        model = Profile
        fields = ['balance', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)  

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'profile')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        return token

class CaseSerializer(serializers.ModelSerializer):
    vegetables = VegetableSerializer(many=True, read_only=True)
    
    class Meta:
        model = Case
        fields = ['id', 'name', 'description', 'price', 'image_url', 'vegetables', 'is_active']

class InventorySerializer(serializers.ModelSerializer):
    vegetable = VegetableSerializer(read_only=True)
    
    class Meta:
        model = Inventory
        fields = ['id', 'vegetable', 'quantity', 'acquired_at']