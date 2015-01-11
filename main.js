/** @jsx React.DOM */

var React = require('react');

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

var BigPhoto = React.createClass({
  getDefaultProps: function() {
    return {
      photo: {}
    };
  },

  getInitialState: function() {
    return {
      isLoading: true
    }
  },

  handleImageLoaded: function() {
    this.setState({isLoading: false});
  },

  componentWillReceiveProps: function() {
    this.setState({
      isLoading: true,
      lastPhoto: this.props.photo ? this.props.photo : null
    });
  },

  getResizedDimensions: function(dims) {
    var width = dims.width;
    var height = dims.height;
    var multiplier = Math.min(900/width, 500/height);
    width *= multiplier;
    height *= multiplier;
    return {width:width, height: height};
  },

  render: function() {
    var photo = this.props.photo;
    var loadingMessage = null;
    var src = photo.images[0].source;
    var dims = this.getResizedDimensions(photo.images[0])
    var posRight = 0;
    if (this.state.isLoading) {
      loadingMessage = <p className="loading">Loading...</p>;
      var img = new Image();
      img.onload = this.handleImageLoaded;
      img.src = src;
      src = null;
    }
    return (
      <div className="BigPhoto">
        <div
          className="holder"
          style={{width:dims.width+"px", height:dims.height+"px"}}
          onClick={this.props.onClick}>
          <img
            style={{right:posRight+"px"}}
            className={this.state.isLoading ? "loading" : ""}
            src={src}
            onLoad={this.handleImageLoaded}/>
          {loadingMessage}
        </div>
        <p className="caption">{photo.name} <LocationLink location={photo.place}/></p>
      </div>
    );
  }
});

var PhotoViewer = React.createClass({
  getDefaultProps: function() {
    return {
      photos: [],
      initialPhotoIndex: 0
    }
  },

  getInitialState: function() {
    return {
      currentPhotoIndex: null
    }
  },

  componentDidMount: function() {
    if (this.props.photos.length > 0) {
      this.setState({currentPhotoIndex: this.props.initialPhotoIndex});
    }
  },

  componentWillReceiveProps: function(nextProps) {
    if (nextProps.initialPhotoIndex !== this.props.initialPhotoIndex) {
      this.setState({currentPhotoIndex: nextProps.initialPhotoIndex});
    }
  },

  handlePhotoClick: function() {
    var nextIndex = this.state.currentPhotoIndex + 1;
    if (nextIndex >= this.props.photos.length) {
      nextIndex = 0;
    }
    this.setState({currentPhotoIndex:nextIndex});
  },

  render: function() {
    if (this.state.currentPhotoIndex !== null) {
      var photo = this.props.photos[this.state.currentPhotoIndex];
      return <BigPhoto photo={photo} onClick={this.handlePhotoClick} />
    }
    return null;
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
          return <img className="thumb" onClick={this.handleImgClick.bind(this, index)} src={photo.picture}/>;
        }.bind(this));
        if (currentPhotoIndex === null && cachedPhotos.length) {
          currentPhotoIndex = 0;
        }
      }
      body = (
        <div>
          <div className="buttons">
            <button onClick={this.handleSync}>Sync</button>
            <button onClick={this.handleLogout}>Log out</button>
          </div>
          <PhotoViewer photos={cachedPhotos} initialPhotoIndex={currentPhotoIndex}/>
          <hr/>
        </div>
      );
    } else {
      body = <button onClick={this.handleLogin}>Connect to Facebook</button>;
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