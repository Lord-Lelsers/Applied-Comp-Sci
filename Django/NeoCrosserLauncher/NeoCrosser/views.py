from django.shortcuts import render

from django.http import HttpResponse, HttpResponseRedirect
from .models import TopScore, Account
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout


def index(request):
    display_name = ""
    if request.user.is_authenticated:
        display_name = Account.objects.get(user=request.user).display_name
    context = {
        "is_login": request.user.is_authenticated,
        "display_name": display_name
    }
    return render(request, 'NeoCrosser/index.html', context)

def signup(request):
    return render(request, 'NeoCrosser/signup.html')

def loginPage(request):
    return render(request, 'NeoCrosser/login.html')

def scores(request):
    context = {'scores_list': TopScore.objects.order_by('-score')}
    return render(request, 'NeoCrosser/scores.html', context)

def createAccount(request):
    display_name = request.POST['display']
    username = request.POST['username']
    password1 = request.POST['password1']
    password2 = request.POST['password2']

    failContext = {
        'error_message': "Error",
        'a': display_name,
        'b': username,
        'c': password1,
        'd': password2
    }

    # TODO: replace the a/b/c/d with a function or something better

    if display_name == "" or username == "" or password1 == "" or password2 == "":
        failContext.error_message = "All fields must be filled in"
        return render(request, 'NeoCrosser/signup.html', failContext)
    elif password1 != password2:
        failContext.error_message = "Passwords do not match"
        return render(request, 'NeoCrosser/signup.html', failContext)

    users = Account.objects.all()
    for user in users:
        if user.username == username:
            failContext.error_message = "That username is already in use"
            return render(request, 'NeoCrosser/signup.html', failContext)
        elif user.display_name == display_name:
            failContext.error_message = "That display name is already in use"
            return render(request, 'NeoCrosser/signup.html', failContext)

    user = User(username=username, password=password1)
    user.save()
    acc = Account(display_name=display_name, user=user)
    acc.save()

    person = authenticate(username=username, password=password1)
    if person is not None:
        # IF success, then use the login function so the session persists.
        login(request, person)
    return HttpResponseRedirect("/neocrosser")


def checkLogin(request):
    username = request.POST['username']
    password = request.POST['password']

    failContext = {
        'error_message': "Error",
        'a': username,
        'b': password
    }

    if username == "" or password == "":
        failContext.error_message = "All fields must be filled in"
        return render(request, 'NeoCrosser/login.html', failContext)

    user = authenticate(username=username, password=password)
    if user is not None:
        # IF success, then use the login function so the session persists.
        login(request, user)
        return HttpResponseRedirect("/neocrosser")

    failContext.error_message = "Login not found"
    return render(request, 'NeoCrosser/login.html', failContext)

def logoutUser(request):
    logout(request)
    return HttpResponseRedirect("/neocrosser")  

def game(request):
    return render(request, 'NeoCrosser/game.html')