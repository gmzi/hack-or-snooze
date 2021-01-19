const BASE_URL = 'https://hack-or-snooze-v3.herokuapp.com';

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  // REFACTORED SO AS TO LOAD MORE STORIES
  // TODO: make a while loop so it will load all the stories available in server.
  static async getStories() {
    // store all stories:
    const responseBundle = [];

    // first request:
    const batch1 = await axios.get(`${BASE_URL}/stories`);
    // check if there are more stories to load:
    if (batch1.data.stories.length >= 25) {
      let skip = batch1.data.stories.length;
      const batchMore = await axios.get(`${BASE_URL}/stories?skip=${skip}`);
      const moreStories = batchMore.data.stories;
      for (let story of moreStories) {
        batch1.data.stories.push(story);
      }
      responseBundle.push(batch1);
      skip += batchMore.data.stories.length;
    } else {
      responseBundle.push(batch1);
    }

    // store the StoryList instance to return it and generate the HTML markup:
    let result;

    responseBundle.forEach(function (response) {
      const stories = response.data.stories.map((story) => new Story(story));
      const storyList = new StoryList(stories);
      result = storyList;
    });
    return result;
  }

  static async getInfiniteStories(skip) {
    const response = await axios.get(`${BASE_URL}/stories?skip=${skip}`);

    const stories = response.data.stories.map((story) => new Story(story));

    const storyList = new StoryList(stories);
    console.log(response);
    return storyList;
  }

  static async addStory(user, title, author, url) {
    const storyObj = await axios.post(
      'https://hack-or-snooze-v3.herokuapp.com/stories',
      { token: user.loginToken, story: { author, title, url } }
    );
    // make the new Story instance:
    const newStory = new Story(storyObj.data.story);
    return newStory;
  }

  static async deleteStory(id, token) {
    const response = await axios.delete(
      `https://hack-or-snooze-v3.herokuapp.com/stories/${id}`,
      {
        params: {
          token,
        },
      }
    );
  }
}

class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;

    // these are all set to defaults, not passed in by the constructor
    this.loginToken = '';
    this.favorites = [];
    this.ownStories = [];
  }

  static async create(username, password, name) {
    const response = await axios.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name,
      },
    });

    // build a new User instance from the API response
    const newUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    newUser.loginToken = response.data.token;

    return newUser;
  }

  static async login(username, password) {
    const response = await axios.post(`${BASE_URL}/login`, {
      user: {
        username,
        password,
      },
    });

    // build a new User instance from the API response
    const existingUser = new User(response.data.user);

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(
      (s) => new Story(s)
    );
    existingUser.ownStories = response.data.user.stories.map(
      (s) => new Story(s)
    );

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = response.data.token;

    return existingUser;
  }

  static async getLoggedInUser(token, username) {
    // if we don't have user info, return null
    if (!token || !username) return null;

    // call the API
    const response = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {
        token,
      },
    });

    // instantiate the user from the API information
    const existingUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = token;

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(
      (s) => new Story(s)
    );
    existingUser.ownStories = response.data.user.stories.map(
      (s) => new Story(s)
    );
    return existingUser;
  }

  static async addFav(username, id, token) {
    const response = await axios.post(
      `${BASE_URL}/users/${username}/favorites/${id}`,
      { token }
    );

    // instantiate the user from the API information
    const existingUser = new User(response.data.user);

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(
      (s) => new Story(s)
    );
    existingUser.ownStories = response.data.user.stories.map(
      (s) => new Story(s)
    );
    return existingUser;
  }

  static async removeFav(username, id, token) {
    const response = await axios.delete(
      `https://hack-or-snooze-v3.herokuapp.com/users/${username}/favorites/${id}`,
      { params: { token } }
    );
    // instantiate the user from the API information
    const existingUser = new User(response.data.user);

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(
      (s) => new Story(s)
    );
    existingUser.ownStories = response.data.user.stories.map(
      (s) => new Story(s)
    );
    return existingUser;
  }
}

class Story {
  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }
}
