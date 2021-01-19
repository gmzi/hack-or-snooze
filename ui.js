async function ui() {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $('#all-articles-list');
  const $submitForm = $('#submit-form');
  const $filteredArticles = $('#filtered-articles');
  const $loginForm = $('#login-form');
  const $createAccountForm = $('#create-account-form');
  const $ownStories = $('#my-articles');
  const $navLogin = $('#nav-login');
  const $navLogOut = $('#nav-logout');
  const $navFavs = $('#nav-favs');

  const $navCreateStory = $('#nav-create-story');
  const $createStoryForm = $('#create-story-form');
  const $btnFav = $('.btn-fav');

  let storyList = null;

  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on('submit', async function (evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $('#login-username').val();
    const password = $('#login-password').val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on('submit', async function (evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $('#create-account-name').val();
    let username = $('#create-account-username').val();
    let password = $('#create-account-password').val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on('click', function () {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on('click', function () {
    showLoginForm();
  });

  function showLoginForm() {
    $loginForm.show();
    $createAccountForm.show();
    $allStoriesList.hide();
    $('#searchbar').hide();
    $('.search-results').hide();
  }
  /**
   * Event handler for Navigation to Homepage
   */

  $('body').on('click', '#nav-all', async function () {
    location.reload();
  });

  /***
  EVENT HANDLER FOR NEW STORY LINK */
  $navCreateStory.on('click', function () {
    $allStoriesList.hide();
    $('.search-results').hide();
    $('#searchbar').hide();
    $('#favs-section').hide();
    $('#create-story').show();
    $('#create-story-form').show();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
      loggedInStories();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger('reset');
    $createAccountForm.trigger('reset');

    // show the stories
    $allStoriesList.show();
    $('#searchbar').show();

    // update the navigation bar
    showNavForLoggedInUser();
    loggedInStories();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;

    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance,
   * WORKS BOTH FOR MAIN LIST AND FOR FAVORITES SECTION.
   */

  function generateStoryHTML(story, section) {
    if (section === undefined) {
      let hostName = getHostName(story.url);
      // render story markup
      const storyMarkup = $(`
      <li id="${story.storyId}">
        <small class="btn-fav">&#9734</small>
        <small class="article-fav hidden" id="btn-fav-remove">&#9733</small>
        <small class="title">
          <a class="article-link" href="${story.url}" target="a_blank"><strong class="searchable">${story.title}</strong></a>
          <small class="article-hostname ${hostName} searchable">(${hostName})</small>
        </small>
        <br>
        <small class="article-author">by <span class="searchable">${story.author}</span> | </small>
        <small class="article-username">posted by <span class="searchable">${story.username}</span> | </small>
        <small class="article-hide">hide</small>
      </li>
    `);

      return storyMarkup;
    }
    if (section === 'favs') {
      let hostName = getHostName(story.url);

      // render story markup
      const storyMarkup = $(`
      <li id="${story.storyId}">
        <small id="star">&#9733</small>
        <small class="article-fav hidden" id="btn-fav-remove">&#9733</small>
        <small class="title">
          <a class="article-link" href="${story.url}" target="a_blank"><strong>${story.title}</strong></a>
          <small class="article-hostname ${hostName}">(${hostName})</small>
        </small>
        <br>
        <small class="article-author">by ${story.author} | </small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

      return storyMarkup;
    }
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $navCreateStory.show();
    $navFavs.show();
    $('#nav-username').text(currentUser.username);
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf('://') > -1) {
      hostName = url.split('/')[2];
    } else {
      hostName = url.split('/')[0];
    }
    if (hostName.slice(0, 4) === 'www.') {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem('token', currentUser.loginToken);
      localStorage.setItem('username', currentUser.username);
    }
  }

  /* SHOW FAVED STORIES */
  function loggedInStories() {
    if (currentUser) {
      let list = Array.from($('li'));
      let userFavs = currentUser.favorites;

      let filteredFavs = list.filter(function (val) {
        for (let i = 0; i < userFavs.length; i++) {
          if (userFavs[i].storyId.includes(val.id)) {
            val.firstElementChild.classList.add('hidden');
            val.firstElementChild.nextElementSibling.classList.remove('hidden');
            return val;
          }
        }
      });
    }
  }

  /* HANDLE CLICK TO FAV STORIES BUTTON */
  function btnFav() {
    $('.btn-fav').on('click', async function (evt) {
      if (currentUser) {
        const username = currentUser.username;
        const storyId = evt.target.parentElement.id;
        const userToken = currentUser.loginToken;

        const favsUpdated = await User.addFav(username, storyId, userToken);
        evt.target.parentElement.firstElementChild.classList.add('hidden');
        evt.target.parentElement.firstElementChild.nextElementSibling.classList.remove(
          'hidden'
        );
        // update the local currentUser with the response of the API request:
        currentUser.favorites = favsUpdated.favorites;
      } else {
        alert('must log in to fav');
        showLoginForm();
      }
    });
  }
  btnFav();

  /* HANDLE CLICK ON UNFAV STORIES BUTTON */
  function btnUnfav() {
    $('li #btn-fav-remove').on('click', async function (evt) {
      const username = currentUser.username;
      const storyId = evt.target.parentElement.id;
      const userToken = currentUser.loginToken;

      const favsUpdated = await User.removeFav(username, storyId, userToken);
      evt.target.parentElement.firstElementChild.classList.remove('hidden');
      evt.target.parentElement.firstElementChild.nextElementSibling.classList.add(
        'hidden'
      );
      // update the local currentUser with the response of the API request:
      currentUser.favorites = favsUpdated.favorites;
    });
  }
  btnUnfav();

  /* VIEW MY FAVORITES */

  $navFavs.on('click', function (evt) {
    const $favsList = $('#favs-list');
    $favsList.empty();

    $('#all-articles-list').hide();
    $('#searchbar').hide();
    $('#search-results-list').hide();
    $('#create-story').hide();
    $('#favs-section').show();

    updateFavs();
  });

  function updateFavs() {
    const userFavs = currentUser.favorites;
    const $favsList = $('#favs-list');
    for (let i = 0; i < userFavs.length; i++) {
      const result = generateStoryHTML(userFavs[i], 'favs');
      $favsList.append(result.get()[0]);
    }
    if ($('#favs-list').children().length === 0) {
      $('#no-favs').show();
      $('#empty-favslist').hide();
    }
  }

  /* CLEAN ALL FAVORITES */

  $('#empty-favslist').on('click', function () {
    removeAllFavorites();
    $('#favs-list').empty();
    $('#empty-favslist').hide();
  });

  async function removeAllFavorites() {
    userFavs = currentUser.favorites;
    for (let fav of userFavs) {
      let storyId = fav.storyId;
      let username = currentUser.username;
      let userToken = currentUser.loginToken;
      const favsUpdated = await User.removeFav(username, storyId, userToken);
      currentUser.favorites = favsUpdated.favorites;
    }
  }

  /* CREATE STORY */

  $createStoryForm.on('submit', function (evt) {
    evt.preventDefault();
    // capture inputs:
    let title = $('#create-story-title').val();
    let author = $('#create-story-author').val();
    let url = $('#create-story-url').val();

    // check if inputs are empty
    if (title === '' || author === '' || url === '') {
      alert('all fields required');
    } else {
      StoryList.addStory(currentUser, title, author, url);

      $createStoryForm.trigger('reset');
      $createStoryForm.hide();

      // update stories list:
      generateStories();

      $('#msg-done').removeClass('hidden');
    }
  });

  /* HIDE STORY */
  function hideStory() {
    $('.article-hide').on('click', async function (evt) {
      if (currentUser) {
        const id = evt.target.parentElement.id;
        const token = currentUser.loginToken;
        const owner =
          evt.target.parentElement.lastElementChild.previousElementSibling
            .innerText;
        if (owner.includes(currentUser.username)) {
          await StoryList.deleteStory(id, token);
          evt.target.parentElement.remove();
          return;
        } else {
          return alert('must own the story to delete it');
        }
      } else {
        alert('need to be logged in and own the story to hide it');
        showLoginForm();
        return;
      }
    });
  }

  hideStory();

  /* SEARCH FORM SUBMIT */

  $('#searchform').on('submit', function (e) {
    e.preventDefault();
    const $list = $('#search-results-list');
    $list.empty();
    let input = document.querySelector('#searchform input');
    if (input.value === '') {
      alert('please type search term');
    } else {
      let value = input.value;
      search(value);
      input.value = '';
    }
  });

  /* SEARCH FORM LOGIC */

  function search(value) {
    const items = Array.from(
      document.querySelectorAll('#all-articles-list li')
    );
    const list = document.querySelector('#search-results-list');
    const found = items.filter(function (e) {
      const searchables = e.getElementsByClassName('searchable');
      for (let item of searchables) {
        if (
          item.innerHTML.includes(value) ||
          item.innerHTML.toLowerCase().includes(value) ||
          item.innerHTML.toLowerCase().includes(value.toLowerCase()) ||
          item.innerHTML.includes(value.toLowerCase())
        ) {
          return item.getElementsByTagName('li');
        }
      }
    });
    if (found.length > 0) {
      found.forEach(function (val) {
        list.prepend(val);
      });
    } else {
      const notFound = document.createElement('p');
      notFound.setAttribute('id', 'not-found');
      notFound.innerText = 'nothing found';
      list.prepend(notFound);
    }
  }
}

ui();
