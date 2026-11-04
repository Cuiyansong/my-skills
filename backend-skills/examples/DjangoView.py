from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
import json

class UserView(View):
    
    def get(self, request):
        users = User.objects.all()
        data = [{'id': user.id, 'name': user.name} for user in users]
        return JsonResponse(data, safe=False)
    
    def post(self, request):
        data = json.loads(request.body)
        user = User.objects.create(
            name=data['name'],
            email=data['email']
        )
        return JsonResponse({'id': user.id}, status=201)

@csrf_exempt
def user_detail(request, user_id):
    if request.method == 'GET':
        user = User.objects.get(id=user_id)
        return JsonResponse({'id': user.id, 'name': user.name})
    elif request.method == 'PUT':
        user = User.objects.get(id=user_id)
        data = json.loads(request.body)
        user.name = data['name']
        user.save()
        return JsonResponse({'id': user.id, 'name': user.name})