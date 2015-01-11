/** @jsx React.DOM */
var LocationLink = React.createClass({
  getDefaultProps: function() {
    return {
      location: {}
    };
  },

  render: function() {
    var location = this.props.location;
    if (!location.id) {
      return null;
    }
    return (
      <span>
        &mdash; at <a target="_blank" href={"http://fb.com/"+location.id}>{location.name}</a>
      </span>
    );
  }
});

var FrontPage = React.createClass({
  getInitialState: function() {
    return {
      currentPhotoIndex: null,
      user: Parse.User.current()
    }
  },

  loadUser: function(objectId) {
    console.log("loading user");
    var query = new Parse.Query(Parse.User);
    query.get(objectId, {
      success: function(user){
        this.setState({user:user});
      }.bind(this),
      error: function(error) {

      }
    });
  },

  componentDidMount: function() {
    if (!this.state.user) {
      this.loadUser('Ckf47czPVC');
    }
  },

  render: function () {
    var body = null;
    var photoElements = null;
    if (this.state.user) {
      var currentPhotoIndex = this.state.currentPhotoIndex;
      var cachedPhotos = this.state.user.get('cachedPhotos');
      if (cachedPhotos) {
        photoElements = cachedPhotos.map(function(photo, index) {
          return (
            <div className="holder">
              <a href={photo.images[0].source} target="_blank">
                <img onClick={this.handleImgClick.bind(this, index)} src={photo.images[0].source}/>
              </a>
              <p>{photo.name} <LocationLink location={photo.place}/></p>
            </div>
          );
        }.bind(this));
        if (currentPhotoIndex === null && cachedPhotos.length) {
          currentPhotoIndex = 0;
        }
      }
      if (Parse.User.current()) {
        body = (
          <div>
            <div className="buttons">
              <button onClick={this.handleSync}>Sync</button>
              <button onClick={this.handleLogout}>Log out</button>
            </div>
          </div>
        );
      } else {
        body = (
          <div className="buttons">
            <button onClick={this.handleLogin}>Log In</button>
          </div>
        );
      }
    } else {
      body = <p>Loading...</p>;
    }
    return (
      <div className="FrontPage">
        <h1>Livre</h1>
        {body}
        <div className="thumbnails">
          {photoElements}
        </div>
        <div className="footer">Created by Paul and Meghan</div>
      </div>
    );
  },

  handleImgClick: function(photoIndex) {
    this.setState({currentPhotoIndex:photoIndex});
  },

  handleLogin: function (event) {
    Parse.FacebookUtils.logIn("user_photos", {
      success: function(user) {
        if (!user.existed()) {
          // alert("User signed up and logged in through Facebook!");
        } else {
          // alert("User logged in through Facebook!");
        }
        this.setState({user:user});
      }.bind(this),
      error: function(user, error) {
        alert("User cancelled the Facebook login or did not fully authorize.");
      }
    });
  },

  handleSync: function (event) {
    FB.api("/me/photos/uploaded", function(response) {
      if (response.error) {
        if (response.error.code == 190 && response.error.error_subcode == 463) {
          // access token has expired
          console.log("logging in to facebook to get a new access token");
          this.handleLogin();
          return;
        }
        console.error("Receieved error during sync:", response.error);
        alert(response.error.message);
        return;
      }
      var photos = response.data;
      var user = Parse.User.current();
      user.set("cachedPhotos", photos);
      user.save(null, {
        success: function (user) {
          this.setState({user:user});
        }.bind(this)
      });
    }.bind(this));
  },

  handleLogout: function (event) {
    Parse.User.logOut();
    this.setState(this.getInitialState());
  }
});

React.render(<FrontPage/>, document.body);