import random
from numpy import double
import base64

from django.shortcuts import render, redirect
from django.http import HttpResponseRedirect
from .models import Account, Word, Score
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.utils import timezone


def display_welcome(request):
    display_name = ""
    if request.user.is_authenticated:
        try:
            display_name = Account.objects.get(user=request.user).display_name
        except:  # incase it is admin account which is User not Account
            display_name = request.user.username
    context = {"is_login": request.user.is_authenticated, "display_name": display_name}
    return render(request, "wordle/welcome.html", context)


def back_to_welcome(request):
    return HttpResponseRedirect("/wordle")


def display_signup_page(request):
    if request.user.is_authenticated:
        return HttpResponseRedirect("/wordle")
    context = request.session.get("context", {})
    request.session.pop("context", None)
    return render(request, "wordle/signup_page.html", context)


def create_account(request):
    if request.user.is_authenticated:
        return HttpResponseRedirect("/wordle")
    try:
        display_name = request.POST["display"]
        username = request.POST["username"]
        password1 = request.POST["password1"]
        password2 = request.POST["password2"]
    except:
        return redirect("wordle:display_signup_page")

    fail_context = {
        "error_message": "Error",
        "a": display_name,
        "b": username,
        "c": password1,
        "d": password2,
    }

    if display_name == "" or username == "" or password1 == "" or password2 == "":
        fail_context["error_message"] = "All fields must be filled in"
        request.session["context"] = fail_context
        return redirect("wordle:display_signup_page")
    elif password1 != password2:
        fail_context["error_message"] = "Passwords do not match"
        request.session["context"] = fail_context
        return redirect("wordle:display_signup_page")

    accounts = Account.objects.all()
    for account in accounts:
        if account.user.username == username:
            fail_context["error_message"] = "That username is already in use"
            request.session["context"] = fail_context
            return redirect("wordle:display_signup_page")
        elif account.display_name == display_name:
            fail_context["error_message"] = "That display name is already in use"
            request.session["context"] = fail_context
            return redirect("wordle:display_signup_page")

    user = User.objects.create_user(username=username, password=password1)
    user.save()

    account = Account(display_name=display_name, user=user)
    account.save()

    person = authenticate(username=username, password=password1)
    if person is not None:
        login(request, person)
    return HttpResponseRedirect("/wordle")


def display_login_page(request):
    if request.user.is_authenticated:
        return HttpResponseRedirect("/wordle")
    context = request.session.get("context", {})
    request.session.pop("context", None)
    return render(request, "wordle/login_page.html", context)


def check_login(request):
    if request.user.is_authenticated:
        return HttpResponseRedirect("/wordle")
    try:
        username = request.POST["username"]
        password = request.POST["password"]
    except:
        return redirect("wordle:display_login_page")

    fail_context = {"error_message": "Error", "a": username, "b": password}

    if username == "" or password == "":
        fail_context["error_message"] = "All fields must be filled in"
        request.session["context"] = fail_context
        return redirect("wordle:display_login_page")

    user = authenticate(username=username, password=password)
    if user is not None:
        login(request, user)
        return HttpResponseRedirect("/wordle")

    fail_context["error_message"] = "Login not found"
    request.session["context"] = fail_context
    return redirect("wordle:display_login_page")


def logout_user(request):
    logout(request)
    return HttpResponseRedirect("/wordle")


def display_account_settings(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect("/wordle")
    context = request.session.get("context", {})
    request.session.pop("context", None)
    return render(request, "wordle/account_settings.html", context)


def display_change_setting(request, setting):
    if not request.user.is_authenticated:
        return HttpResponseRedirect("/wordle")
    if setting not in ["Password", "Username", "Display Name"]:
        return redirect("wordle:display_account_settings")
    context = request.session.get(
        "context",
        {"setting": setting, "type": "password" if setting == "Password" else "text"},
    )
    request.session.pop("context", None)
    return render(request, "wordle/change_setting.html", context)


def change_setting(request, setting):
    if not request.user.is_authenticated:
        return HttpResponseRedirect("/wordle")
    try:
        password = request.POST["password"]
        value1 = request.POST[setting + "1"]
        value2 = request.POST[setting + "2"]
        # Side effect: checks if setting is Password, Username, or Display Name
        # if randomly changing the setting in the url -> won't POST -> throw error
    except:
        return redirect("wordle:display_account_settings")

    fail_context = {
        "error_message": "Error",
        "a": password,
        "b": value1,
        "c": value2,
        "setting": setting,
        "type": "password" if setting == "Password" else "text",
    }

    if password == "" or value1 == "" or value2 == "":
        fail_context["error_message"] = "All fields must be filled in"
        request.session["context"] = fail_context
        return redirect("wordle:display_change_setting", setting)

    username = request.user.username
    user = authenticate(username=username, password=password)
    if user is None:
        fail_context["error_message"] = "Incorrect password"
        request.session["context"] = fail_context
        return redirect("wordle:display_change_setting", setting)
    if value1 != value2:
        fail_context["error_message"] = "New values do not match"
        request.session["context"] = fail_context
        return redirect("wordle:display_change_setting", setting)

    if setting == "Display Name":
        if Account.objects.filter(display_name=value1).exists():
            fail_context["error_message"] = "Display name already in use"
            request.session["context"] = fail_context
            return redirect("wordle:display_change_setting", setting)
        person = Account.objects.get(user=User.objects.get(username=username))
        person.display_name = value1
        person.save()
    else:
        person = User.objects.get(username=username)
        if setting == "Password":
            person.set_password(value1)
            person.save()
            login(request, person)
        else:
            if User.objects.filter(username=value1).exists():
                fail_context["error_message"] = "Username already in use"
                request.session["context"] = fail_context
                return redirect("wordle:display_change_setting", setting)
            person.username = value1
            person.save()
            login(request, person)

    request.session["context"] = {"success": setting + " changed"}
    return redirect("wordle:display_account_settings")


def display_SP_launcher(request):
    return render(request, "wordle/SP_launcher.html")


def display_game(request, mode):
    try:
        word_length = request.POST["wordLenSub"]
        tries = request.POST["triesSub"]
        double_letters = request.POST["doubleLettersSub"] == "true"
        cup = request.POST["cupSub"].strip()
        # common is True always for MP, short cuirut the request.POST if MP
        common = mode == "MP" or request.POST["commonSub"] == "true"
    except:
        if mode == "SP":
            return redirect("wordle:display_SP_launcher")
        return redirect("wordle:display_MP_hub")

    # if they already did the daily cup
    if "daily" in cup:
        for score in list(
            Score.objects.filter(account=Account.objects.get(user=request.user))
            .filter(cup=cup)
            .order_by("cup")
        ):
            if score.check_in_time_frame():
                request.session["context"] = {
                    "message": "You can only attempt a daily cup once per day!"
                }
                return redirect("wordle:display_MP_hub")

    word, words = get_word(word_length, double_letters, common)
    context = {
        "availableWords": words,
        "word_length": word.length,
        "encoded_word": base64.b64encode(word.txt.encode()),
        "tries": tries,
        "mode": mode == "SP",
        "cup": cup,
        "doubleLetters": double_letters,
    }
    print("WORD: %s" % word.txt)
    return render(request, "wordle/game.html", context)


def display_MP_hub(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect("/wordle")
    context = request.session.get("context", {})
    request.session.pop("context", None)
    return render(request, "wordle/MP_hub.html", context)


def display_rankings(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect("/wordle")
    try:
        word_length = request.POST["wordLenSub"]
        tries = request.POST["triesSub"]
        double_letters = request.POST["doubleLettersSub"] == "true"
        cup = request.POST["cupSub"].strip()
    except:
        if request.session.get("POST") == None:
            return redirect("wordle:display_MP_hub")
        word_length = request.session.get("POST")["wordLenSub"]
        tries = request.session.get("POST")["triesSub"]
        double_letters = request.session.get("POST")["doubleLettersSub"]
        cup = request.session.get("POST")["cupSub"]
        # Don't pop, so they can go back and it will show this same page

    scores = []
    for score in list(Score.objects.filter(cup=cup).order_by("guesses", "time")):
        if score.check_in_time_frame():
            scores.append(score)

    context = {
        "wordLen": word_length,
        "tries": tries,
        "doubleLetters": double_letters,
        "cup": cup,
        "scores": scores,
    }
    return render(request, "wordle/rankings.html", context)


def MP_receive_score(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect("/wordle")
    try:
        cup = request.POST["cupName"].strip()
        word = request.POST["word"].strip()
        guesses = int(request.POST["guesses"])
        time = int(request.POST["time"])
        double_letters = request.POST["doubleLettersSub"] == "true"
        tries = request.POST["triesSub"]
    except:
        return redirect("wordle:display_MP_hub")

    wordObj = Word.objects.get(txt=word)
    acc = Account.objects.get(user=request.user)
    score = Score(
        cup=cup,
        account=acc,
        word=wordObj,
        guesses=guesses,
        time=time,
        sub_date=timezone.now(),
    )
    score.save()

    request.session["POST"] = {
        "wordLenSub": len(word),
        "triesSub": tries,
        "doubleLettersSub": double_letters,
        "cupSub": cup,
    }
    return redirect("wordle:display_rankings")


def display_personal_scores(request):
    if not request.user.is_authenticated:
        return HttpResponseRedirect("/wordle")
    cups = []
    scores = list(
        Score.objects.filter(account=Account.objects.get(user=request.user)).order_by(
            "cup", "guesses", "time"
        )
    )
    if len(scores) != 0:
        current_cup = scores[0].cup
        cup_scores = []
        for score in scores:
            if score.check_in_time_frame():
                if score.cup == current_cup:
                    cup_scores.append(score)
                else:
                    cups.append(cup_scores)
                    cup_scores = [score]
                    current_cup = score.cup
        cups.append(cup_scores)
    context = {"scores": cups}
    return render(request, "wordle/personal_scores.html", context)


# returns a random word with specified options, and the list of words as strs
def get_word(wordLen, double_letters, common):
    words = Word.objects.filter(length=wordLen)
    if not double_letters:
        words = words.filter(double_letters=False)
    if common:
        words = words.filter(common=True)
    str_list = []
    for word in words:
        str_list.append(word.txt)
    return random.choice(words), str_list


"""
from .allWords import get_all_words, get_common_words
def create_dictionary():
    Word.objects.all().delete()
    common_words = get_common_words()
    all_words = get_all_words()
    i = 0
    for word in all_words:
        if (
            not len(Word.objects.filter(txt=word)) > 0
        ):  # just incase there was a duplicate
            double_letters = False
            letters = []
            for letter in word:
                if letter in letters:
                    double_letters = True
                    break
                else:
                    letters.append(letter)
            w = Word(
                txt=word.strip(),
                length=len(word),
                double_letters=double_letters,
                common=word in common_words,
            )
            w.save()
            print(
                "%i = %i/%i)  %s" % ((i / len(all_words) * 100), i, len(all_words), w)
            )
            i = i + 1
"""
