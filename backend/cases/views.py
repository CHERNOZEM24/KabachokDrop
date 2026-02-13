from django.contrib.auth.models import User
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
import random
from .models import Case, Vegetable
from .serializers import CaseSerializer, VegetableSerializer, UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserDetailView(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.filter(is_active=True)
    serializer_class = CaseSerializer
    
    @action(detail=True, methods=['post'])
    def open(self, request, pk=None):
        case = self.get_object()
        vegetables = case.vegetables.all()
        
        if not vegetables.exists():
            return Response({
                'success': False,
                'message': 'В кейсе нет овощей'
            }, status=status.HTTP_404_NOT_FOUND)
        
        RARITY_WEIGHTS = {
            'common': 10,      
            'uncommon': 5,     
            'rare': 3,         
            'epic': 2,         
            'legendary': 1,    
        }
        
        veg_list = list(vegetables)
        weights = [RARITY_WEIGHTS[veg.rarity] for veg in veg_list]
        
        random_vegetable = random.choices(veg_list, weights=weights, k=1)[0]
        
        serializer = VegetableSerializer(random_vegetable)
        
        return Response({
            'success': True,
            'message': f'🎉 Открыли {case.name}!',
            'reward': serializer.data,
        })