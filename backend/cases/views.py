from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
import random
from django.contrib.auth.models import User
from django.db import transaction
from .models import Case, Vegetable, Profile, Inventory
from .serializers import CaseSerializer, VegetableSerializer, UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer, ProfileSerializer, InventorySerializer

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

class ProfileViewSet(viewsets.GenericViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = ProfileSerializer
    
    def get_object(self):
        return self.request.user.profile
    
    def list(self, request):
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def deposit(self, request):
        profile = self.get_object()
        amount = request.data.get('amount')
        
        try:
            amount = int(amount)
            if amount <= 0:
                return Response({
                    'success': False,
                    'message': 'Сумма должна быть положительной'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if amount > 5000:
                return Response({
                    'success': False,
                    'message': 'Максимальная сумма пополнения - 5000 монет'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except (TypeError, ValueError):
            return Response({
                'success': False,
                'message': 'Введите корректную сумму'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        profile.balance += amount
        profile.save()
        
        return Response({
            'success': True,
            'message': f'Счет пополнен на {amount} монет',
            'new_balance': profile.balance
        })

class InventoryViewSet(viewsets.GenericViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = InventorySerializer
    
    def get_queryset(self):
        return Inventory.objects.filter(user=self.request.user).order_by('-acquired_at')
    
    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def sell(self, request, pk=None):
        try:
            inventory_item = Inventory.objects.get(id=pk, user=request.user)
        except Inventory.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Овощ не найден в инвентаре'
            }, status=status.HTTP_404_NOT_FOUND)
        
        price = inventory_item.vegetable.price
        profile = request.user.profile
        profile.balance += price
        profile.save()
        
        if inventory_item.quantity > 1:
            inventory_item.quantity -= 1
            inventory_item.save()
            message = f'Продан {inventory_item.vegetable.name} за {price} монет. Осталось: {inventory_item.quantity}'
        else:
            inventory_item.delete()
            message = f'Продан {inventory_item.vegetable.name} за {price} монет'
        
        return Response({
            'success': True,
            'message': message,
            'new_balance': profile.balance
        })

class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.filter(is_active=True)
    serializer_class = CaseSerializer
    permission_classes = (AllowAny,)
    
    @action(detail=True, methods=['post'])
    def open(self, request, pk=None):
        case = self.get_object()
        user = request.user
        
        if user.profile.balance < case.price:
            return Response({
                'success': False,
                'message': 'Недостаточно средств на счете'
            }, status=status.HTTP_400_BAD_REQUEST)
        
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
        
        with transaction.atomic():
            user.profile.balance -= case.price
            user.profile.save()
            
            inventory_item, created = Inventory.objects.get_or_create(
                user=user,
                vegetable=random_vegetable,
                defaults={'quantity': 1}
            )
            
            if not created:
                inventory_item.quantity += 1
                inventory_item.save()
        
        serializer = VegetableSerializer(random_vegetable)
        
        return Response({
            'success': True,
            'message': f'🎉 Открыли {case.name}!',
            'reward': serializer.data,
            'new_balance': user.profile.balance
        })