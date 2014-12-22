/** @jsx React.DOM */

var React = require('react');

var FrontPage = React.createClass({
  getInitialState: function() {
    return {
      photos: []
    }
  },

  render: function () {
    var body = null;
    if (Parse.User.current()) {
      body = (
        <div>
          <button onClick={this.handleSync}>Sync</button>
          <button onClick={this.handleLogout}>Log out</button>
        </div>
      );
    } else {
      body = <button onClick={this.handleLogin}>Log in to Facebook</button>;
    }
    var photos = this.state.photos.map(function(photo) {
      return <img src={photo.picture}/>;
    });
    return (
      <div>
        <h1>Livre</h1>
        {body}
        {photos}
      </div>
    );
  },
  handleLogin: function (event) {
    Parse.FacebookUtils.logIn("user_photos", {
      success: function(user) {
        if (!user.existed()) {
          alert("User signed up and logged in through Facebook!");
        } else {
          alert("User logged in through Facebook!");
        }
        window.location = "/";
      },
      error: function(user, error) {
        alert("User cancelled the Facebook login or did not fully authorize.");
      }
    });
  },
  handleSync: function (event) {
    FB.api("/me/photos/uploaded", function(response) {
      if (response.error) {
        alert(response.error.message);
        return;
      }
      var photos = response.data;
      console.log("got response", response);
      this.setState({photos:photos});
    }.bind(this));
  },
  handleLogout: function (event) {
    Parse.User.logOut();
    window.location = "/";
  }
});

React.render(<FrontPage/>, document.body);