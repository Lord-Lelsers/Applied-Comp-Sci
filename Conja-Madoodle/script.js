shown = false;

function setPic(source, id) {
    img = document.getElementById(id);
    img.src = source;
}

function showAccount(popUpId) {
    if (popUpId != "none") {
        div = document.getElementById(popUpId);
    }
    leftBar = document.getElementById("leftBar");
    rightBar = document.getElementById("rightBar");
    txt = document.getElementById("accountTxt");
    img = document.getElementById("accountImg");

    if (!shown) {
        if (popUpId != "none") {
            div.classList.remove("d-none");
            leftBar.classList.remove("col-md-1");
            leftBar.classList.add("col-md-0");
            rightBar.classList.remove("col-md-1");
            rightBar.classList.add("col-md-2");
        }
        txt.classList.add("active");
        img.src = "head2.png";
        shown = true;
    }
    else {
        if (popUpId != "none") {
            div.classList.add("d-none");
            leftBar.classList.add("col-md-1");
            leftBar.classList.remove("col-md-0");
            rightBar.classList.add("col-md-1");
            rightBar.classList.remove("col-md-2");
        }
        txt.classList.remove("active");
        img.src = "head.png";
        shown = false;
    }
}


function addToCart(id) {
    button = document.getElementById(id);
    button.innerText = "Added to Cart!";
    if (button.classList.contains("btn-primary")) {
        button.classList.remove("btn-primary");
        button.classList.add("btn-success");
    }
}

function checkBox(idOfBox) {
    if (idOfBox == "tools") {
        cards = document.getElementsByClassName("tool");
    }
    else {
        cards = document.getElementsByClassName("product");
    }
    for (i = 0; i < cards.length; i++) {
        if (cards[i].classList.contains("d-none")) {
            cards[i].classList.remove("d-none");
        }
        else {
            cards[i].classList.add("d-none");
        }
    }
}