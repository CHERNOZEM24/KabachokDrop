from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Vegetable(models.Model):
    RARITY_CHOICES = [
        ('common', '🥔 Обычный'),
        ('uncommon', '🥕 Необычный'),
        ('rare', '🍅 Редкий'),
        ('epic', '🍆 Эпический'),
        ('legendary', '🎃 Легендарный'),
    ]
    
    name = models.CharField(max_length=100, verbose_name="Название")
    emoji = models.CharField(max_length=10, default='🥦', verbose_name="Эмодзи")
    rarity = models.CharField(max_length=20, choices=RARITY_CHOICES, default='common', verbose_name="Редкость")
    description = models.TextField(blank=True, verbose_name="Описание")
    price = models.IntegerField(default=10, verbose_name="Цена в монетах")
    
    def __str__(self):
        return f"{self.emoji} {self.name}"

class Case(models.Model):
    name = models.CharField(max_length=100, verbose_name="Название кейса")
    description = models.TextField(blank=True, verbose_name="Описание кейса")
    price = models.IntegerField(default=100, verbose_name="Цена открытия")
    image_url = models.URLField(blank=True, verbose_name="Картинка кейса")
    vegetables = models.ManyToManyField(Vegetable, verbose_name="Овощи в кейсе")
    is_active = models.BooleanField(default=True, verbose_name="Активен")
    
    def __str__(self):
        return self.name

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    balance = models.IntegerField(default=0, verbose_name="Баланс")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.balance} монет"

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()