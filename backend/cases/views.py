from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
import random
from .models import Case, Vegetable
from .serializers import CaseSerializer, VegetableSerializer

class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.filter(is_active=True)
    serializer_class = CaseSerializer
    
    @action(detail=True, methods=['post'])
    def open(self, request, pk=None):
        case = self.get_object()
        vegetables = case.vegetables.all()
        
        if vegetables.exists():
            random_vegetable = random.choice(list(vegetables))
            serializer = VegetableSerializer(random_vegetable)
            
            return Response({
                'success': True,
                'message': f'🎉 Открыли {case.name}!',
                'reward': serializer.data
            })
        else:
            return Response({
                'success': False,
                'message': 'В кейсе нет овощей'
            }, status=status.HTTP_404_NOT_FOUND)