import allWords


ALPHABET = list("abcdefghijklmnopqrstuvwxyz")
YELLOW_WEIGHT = 4
GREEN_WEIGHT = 1
DOUBLE_LETTER_WEIGHT = -1


def remove_dups(lst):
    no_dups = []
    for e in lst:
        if e not in no_dups:
            no_dups.append(e)
    no_dups.sort()
    return no_dups


def has_double_letters(word):
    letters = []
    for letter in word:
        if letter in letters:
            return True
        else:
            letters.append(letter)
    return False


def filter_words(words, word_len, double_letters):
    filtered_words = []
    for word in words:
        if len(word) == word_len and not (
            not double_letters and has_double_letters(word)
        ):
            filtered_words.append(word)
    return filtered_words


def bold_text(txt):
    print("#" * (len(txt) + 4))
    print("# " + txt + " #")
    print("#" * (len(txt) + 4))


def get_words(word_len):
    only_common = input_yes_or_no("Only common words [Y/n]? ")
    if only_common:
        if word_len == 5:
            not_only_wordle = input_yes_or_no("Use more than only offical Wordle answer words [Y/n]? ")
            if not not_only_wordle:
                return allWords.get_wordle_words()
        return allWords.get_common_words()
    return allWords.get_all_words()


def input_yes_or_no(prompt):
    try:
        user_input = input(prompt)
        if user_input[0].lower() == "n":
            return False
    except:
        pass
    return True


def input_word_len():
    print("How many letters are in the word?")
    while True:
        try:
            user_input = input("Length: ")
            num = int(user_input)
            assert num > 0 and num <= len(ALPHABET)
            return num
        except:
            print("Hint: enter a positive number!")


def input_green_letters(word_len, gls):
    print("Enter letters that you know the position of (aka the 'green' letters).")
    if len(gls) > 0:
        saved_letters = ""
        for i in range(word_len):
            letter_to_add = "?"
            for j in range(len(gls)):
                if i == gls[j][1]:
                    letter_to_add = gls[j][0].upper()
                    break
            saved_letters += letter_to_add
        print("Current saved green letters: '%s'" % saved_letters)
        keep_gls = input_yes_or_no(
            "Would you like to add on to/keep last enter green letters [Y/n]? "
        )
        if not keep_gls:
            gls = []
    print(
        "First enter the letter, hit [enter] then enter the position of the letter where 1 is the first letter."
    )
    while True:
        try:
            user_input = input("Letter (leave blank to continue): ")
            if len(user_input) == 0:
                return gls
            letter = user_input.lower()[0]
            assert letter in ALPHABET
            user_input = input("Position: ")
            idx = int(user_input)
            assert idx > 0 and idx <= word_len
            gls.append([letter, idx - 1])
            print("")
        except:
            print("Hint: you are doing something wrong (maybe read the directions?)")


def input_yellow_letters(word_len):
    print("Enter letters that you are are in the word (aka the 'yellow' letters).")
    print(
        "First enter the letter, hit [enter] then enter the positions where the letter is not of the letter where 1 is the first letter."
    )
    print(
        """ Example:
    Letter (leave blank to continue): r
    Position(s) where it is not: 1 3\n"""
    )
    yls = []
    while True:
        try:
            user_input = input("Letter (leave blank to continue): ")
            if len(user_input) == 0:
                return yls
            letter = user_input.lower()[0]
            assert letter in ALPHABET
            user_input = input("Position(s) where it is not: ")
            positions = user_input.split(" ")
            idxs = []
            for pos in positions:
                idx = int(pos)
                assert idx > 0 and idx <= word_len
                idxs.append(idx - 1)
            yls.append([letter, idxs])
            print("")
        except:
            print("Hint: you are doing something wrong (maybe read the directions?)")


def input_dark_letters(prompt, dls):
    print(prompt)
    if len(dls) > 0:
        saved_dls = ", ".join(dls)
        print("Current saved letters that not in the word: '%s'" % saved_dls)
        keep_letters = input_yes_or_no(
            "Would you like to add on to/keep last entered letters that are not in the word [Y/n]? "
        )
        if not keep_letters:
            dls = []
    try:
        user_input = input("Letters (ex: 'dia' without the ''s): ")
        letters_input = user_input.lower()
        for letter in letters_input:
            assert letter in ALPHABET
            dls.append(letter)
        return dls
    except:
        print("Hint: you are doing something wrong (enter only letters)")


def is_good_word(word, gls, yls, dls):
    letter_lst = list(word)
    for gl in gls:
        if word[gl[1]] == gl[0]:
            letter_lst.remove(gl[0])
        else:
            return False, letter_lst
    for yl in yls:
        if yl[0] not in letter_lst:
            return False, letter_lst
        for idx in yl[1]:
            if word[idx] == yl[0]:
                return False, letter_lst
        letter_lst.remove(yl[0])
    for dl in dls:
        if dl in letter_lst:
            return False, letter_lst
    return True, letter_lst


def run(words, letter_counts, gls, yls, dls):
    print("\nENTER INFORMATION...\n")

    gls = input_green_letters(len(words[0]), gls)
    print("\n")
    yls = input_yellow_letters(len(words[0]))
    print("\n")
    dls = input_dark_letters("Enter letters that are not in the word.", dls)

    print("\nSEARCHING...")
    possible_words = calc_possible_words(words, gls, yls, dls, letter_counts)
    print("FINISHED SEARCHING...\n")

    if len(possible_words) == 1:
        bold_text("The word is: %s" % possible_words[0][0])
    elif len(possible_words) > 0:
        bold_text("Possible Words:")

        extra_letters = []
        for i in range(len(possible_words) - 1, -1, -1):
            print("%i) %s" % (i + 1, possible_words[i][0]))
            extra_letters += possible_words[i][1]

        extra_letters = remove_dups(extra_letters)
        print("\nLetters worth finding out more (the white/unused letters):")
        letter_str = ", ".join(extra_letters)
        print(letter_str)
    else:
        print("No words found. Did you mis-type or incorrectly enter information?")


def calc_letter_counts(words):
    letter_counts = []
    for i in range(len(ALPHABET)):
        temp = [0] * len(words[0])
        letter_counts.append([0, temp])

    for word in words:
        for i in range(len(word)):
            letter_counts[ALPHABET.index(word[i])][0] += 1
            letter_counts[ALPHABET.index(word[i])][1][i] += 1
    return letter_counts


def calc_possible_words(words, gls, yls, dls, letter_counts):
    word_scores = []
    for word in words:
        good_word = is_good_word(word, gls, yls, dls)
        if good_word[0]:
            score = 0
            for i in range(len(word)):
                score += letter_counts[ALPHABET.index(word[i])][0] * YELLOW_WEIGHT
                score += letter_counts[ALPHABET.index(word[i])][1][i] * GREEN_WEIGHT
            if has_double_letters(word):
                score *= DOUBLE_LETTER_WEIGHT
            word_scores.append([word, good_word[1], score])
    word_scores.sort(key=lambda x: x[2], reverse=True)
    return word_scores


def calc_best_starting_word(words, letter_counts):
    print("\nSTARTING CALCULATIONS...")
    words = filter_words(words, len(words[0]), False)
    word_scores = calc_possible_words(words, [], [], [], letter_counts)
    print("CALCULATIONS DONE...\n")
    return word_scores[0]


def calc_double_letter_weight(words):
    double_letter_words = 0
    for word in words:
        double_letter_words += has_double_letters(word)
    return double_letter_words / len(words)


def main():
    print("\nPROGRAM STARTING...\n")
    bold_text("Welcome to the wordle helper!")

    print("\n")
    word_len = input_word_len()
    print("\n")
    words = get_words(word_len)
    print("\n")
    double_letters = input_yes_or_no("Could there be double letters [Y/n]? ")

    words = filter_words(words, word_len, double_letters)

    if double_letters:
        DOUBLE_LETTER_WEIGHT = calc_double_letter_weight(words)

    letter_counts = calc_letter_counts(words)

    print("\n")
    want_best_word = input_yes_or_no(
        "Would you like to know the best starting word [Y/n]? "
    )
    if want_best_word:
        best_starting_word = calc_best_starting_word(words, letter_counts)
        bold_text("Best starting word: %s" % best_starting_word[0].upper())

    gls = []
    yls = []
    dls = []

    running = True
    while running:
        run(words, letter_counts, gls, yls, dls)
        print("\n")
        running = input_yes_or_no("Run again [Y/n]? ")

    print("\nPROGRAM EXITING...\n")


main()
