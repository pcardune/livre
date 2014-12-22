/** @jsx React.DOM */

var React = require('react');

var FrontPage = React.createClass({
  getInitialState: function() {
    return {
      albums: []
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
    var albums = this.state.albums.map(function(album) {
      var photos = [];
      if (album.photos) {
        photos = album.photos.map(function(photo) {
          return <img src={photo.picture}/>;
        });
      }
      return (
        <div>
          <h3>{album.name}</h3>
          {photos}
        </div>
      );
    });
    return (
      <div>
        <h1>Livre</h1>
        {body}
        {albums}
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
    FB.api("/me/albums", function (response) {
      var albums = response.data;
      this.setState({albums:albums});
      for (var i = 0; i < albums.length; i++) {
        var currentAlbum = albums[i];
        FB.api(
          "/"+currentAlbum.id+"/photos",
          function(album, response) {
            console.log(response.data);
            album.photos = response.data;
            this.setState({albums:albums});
          }.bind(this, currentAlbum)
        );
      }
    }.bind(this));
  },
  handleLogout: function (event) {
    Parse.User.logOut();
    window.location = "/";
  }
});


// function foo() {
//   console.log(this);
// }

// foo(); // window

// var a = {
//   bar: function() {
//     console.log(this);
//   }
// }

// a.bar(); // a

// b = {bar:a.bar}
// b.bar(); // b

// var c = a.bar;
// c(); // window

// var d = a.bar.bind(a);
// d(); // a

// function bind(whatThisShouldBe, someFunction) {
//   return function() {
//     someFunction.call(whatThisShouldBe, arguments);
//   }
// }





React.render(<FrontPage/>, document.body);