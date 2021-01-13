$(async function () {
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

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /***
   * EVENT LISTENER FOR CREATESTORY FORM
   */

  $createStoryForm.on('submit', async function (evt) {
    evt.preventDefault();
    // capture inputs:
    let title = $('#create-story-title').val();
    let author = $('#create-story-author').val();
    let url = $('#create-story-url').val();

    // check if inputs are empty
    if (title === '' || author === '' || url === '') {
      alert('all fields required');
    } else {
      // make the request:
      const storyObj = await axios.post(
        'https://hack-or-snooze-v3.herokuapp.com/stories',
        { token: currentUser.loginToken, story: { author, title, url } }
      );
      // make the new Story instance:
      const newStory = new Story(storyObj.data.story);

      // clear form:
      $createStoryForm.trigger('reset');

      // update stories list:
      generateStories();

      hideElements();

      loggedInStories();

      // show the stories
      // $(loggedInStories()).appendTo($allStoriesList.show());

      return newStory;
    }
  });

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
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $('body').on('click', '#nav-all', async function () {
    hideElements();
    await generateStories();
    $allStoriesList.show();
    if (currentUser) {
      loggedInStories();
    }
  });

  /***
  EVENT HANDLER FOR NEW STORY LINK */
  $navCreateStory.on('click', function () {
    $allStoriesList.hide();
    $createStoryForm.show();
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

    // update the navigation bar
    showNavForLoggedInUser();
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
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
        <small class="hidden article-fav" id="btn-fav">Fav this article</small>
        <small class="hidden article-fav-remove" id="btn-fav-remove">Unfav this article</small>
      </li>
    `);

    return storyMarkup;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm,
      $createStoryForm,
    ];
    elementsArr.forEach(($elem) => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $navCreateStory.show();
    $navFavs.show();
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

  /* SHOW BUTTON TO FAV STORIES */
  function loggedInStories() {
    const btnFav = $('li #btn-fav');
    for (let item of btnFav) {
      btnFav.removeClass('hidden');
    }
  }

  /* HANDLE CLICK ON FAV STORIES BUTTON */
  $('li #btn-fav').on('click', function (evt) {
    console.log('dale');
    const username = currentUser.username;
    const storyId = evt.target.parentElement.id;
    const userToken = currentUser.loginToken;

    User.addFav(username, storyId, userToken);

    // GO TO USER AND TRIGGER THE POST REQUEST
  });
});
