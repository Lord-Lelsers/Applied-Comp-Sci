from django.shortcuts import render, redirect

from django.http import HttpResponse, HttpResponseRedirect
from .models import Account
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout


def getDisplayName(request):
    if request.user.is_authenticated:
        try:
            return Account.objects.get(user=request.user).display_name
        except: # incase it is my admin account
            return request.user.username
    return ""

def index(request):
    context = {
        "is_login": request.user.is_authenticated,
        "display_name": getDisplayName(request)
    }
    return render(request, 'wordle/index.html', context)

def signup(request):
    return render(request, 'wordle/signup.html')

def loginPage(request):
    return render(request, 'wordle/login.html')

def createAccount(request):
    try:
        display_name = request.POST['display']
        username = request.POST['username']
        password1 = request.POST['password1']
        password2 = request.POST['password2']
    except:
        return redirect('wordle:signup')

    failContext = {
        'error_message': "Error",
        'a': display_name,
        'b': username,
        'c': password1,
        'd': password2
    }

    # TODO: replace the a/b/c/d with a function or something better

    if display_name == "" or username == "" or password1 == "" or password2 == "":
        failContext['error_message'] = "All fields must be filled in"
        return render(request, 'wordle/signup.html', failContext)
    elif password1 != password2:
        failContext['error_message'] = "Passwords do not match"
        return render(request, 'wordle/signup.html', failContext)

    accs = Account.objects.all()
    for acc in accs:
        if acc.user.username == username:
            failContext['error_message'] = "That username is already in use"
            return render(request, 'wordle/signup.html', failContext)
        elif acc.display_name == display_name:
            failContext['error_message'] = "That display name is already in use"
            return render(request, 'wordle/signup.html', failContext)

    print(isinstance(password1, str))
    user = User.objects.create_user(username=username, password=password1)
    user.save()

    acc = Account(display_name=display_name, user=user)
    acc.save()

    person = authenticate(username=username, password=password1)
    if person is not None:
        login(request, person)
    return HttpResponseRedirect("/wordle")

def checkLogin(request):
    try:
        username = request.POST['username']
        password = request.POST['password']
    except:
        return redirect('wordle:loginPage')

    failContext = {
        'error_message': "Error",
        'a': username,
        'b': password
    }

    if username == "" or password == "":
        failContext['error_message'] = "All fields must be filled in"
        return render(request, 'wordle/login.html', failContext)

    user = authenticate(username=username, password=password)
    if user is not None:
        login(request, user)
        return HttpResponseRedirect("/wordle")

    failContext['error_message'] = "Login not found"
    return render(request, 'wordle/login.html', failContext)

def logoutUser(request):
    logout(request)
    return HttpResponseRedirect("/wordle")  

def backToIndex(request):
    return HttpResponseRedirect("/wordle")


def SPLauncher(request):
    return render(request, 'wordle/generateWord.html')

def SPGame(request):
    try:
        word = request.POST['word']
        tries = request.POST['tries']
    except:
        return redirect('wordle:SPLauncher')

    return HttpResponseRedirect("/wordle")
    
