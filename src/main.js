/* globals FB */
import React from 'react';
import {render} from 'react-dom';
import Parse from 'parse';
import moment from 'moment';
import {
  Button,
  Panel,
  Image,
  Navbar,
  Grid,
  Nav,
  NavItem,
  Row,
  Col,
  ProgressBar,
  Glyphicon
} from 'react-bootstrap';
require('./css/style.less');

(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

var LocationLink = React.createClass({
  getDefaultProps() {
    return {location:{}};
  },
  render: function() {
    var location = this.props.location;
    if (!location.id) {
      return null;
    }
    return (
      <span className="LocationLink">
        at <a target="_blank" href={"http://fb.com/"+location.id}>{location.name}</a>
      </span>
    );
  }
});

var FrontPage = React.createClass({
  getInitialState: function() {
    return {
      user: Parse.User.current()
    };
  },

  loadUser: function(objectId) {
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
    var photoElements = null;
    let buttons = [];
    if (this.state.user) {
      var cachedPhotos = this.state.user.get('cachedPhotos');
      if (cachedPhotos) {
        photoElements = cachedPhotos.map(function(photo, index) {
          return (
            <Row key={index} className="photo">
              <Col xs={12} md={8} className="image">
                <a href={photo.images[0].source} target="_blank">
                  <Image rounded responsive src={photo.images[0].source}/>
                </a>
              </Col>
              <Col xs={12} md={4} className="description">
                <div className="quoteBlock">
                  {photo.name?
                   <p className="caption">
                     {photo.name}
                   </p> : null}
                  <div className="metadata">
                    {photo.place ?
                     <div>
                       <Glyphicon glyph="map-marker"/>
                       <a target="_blank" href={"http://fb.com/"+photo.place.id}>
                          {photo.place.name}
                       </a>
                     </div>
                     : null}
                    <div>
                      <Glyphicon glyph="time"/>
                      {moment(photo.created_time).format('MMM Do, YYYY')}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          );
        }.bind(this));
      }

      if (Parse.User.current()) {
        buttons = [
          <NavItem onClick={this.handleSync}>Sync</NavItem>,
          <NavItem onClick={this.handleLogout}>Log out</NavItem>
        ];
      } else {
        buttons = [
          <NavItem onClick={this.handleLogin}>Log In</NavItem>
        ];
      }
    }
    return (
      <Grid className="FrontPage">
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>
              <a href="#">Livre</a>
            </Navbar.Brand>
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav>
              {buttons}
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        {this.state.user ? '' : <ProgressBar active now={100} />}
        {photoElements}
        <div className="footer">Created by Paul and Meghan</div>
      </Grid>
    );
  },

  handleLogin: function () {
    Parse.FacebookUtils.logIn("user_photos,user_posts", {
      success: function(user) {
        if (!user.existed()) {
          // alert("User signed up and logged in through Facebook!");
        } else {
          // alert("User logged in through Facebook!");
        }
        this.setState({user:user});
      }.bind(this),
      error: function() {
        alert("User cancelled the Facebook login or did not fully authorize.");
      }
    });
  },

  handleSync: function () {
    FB.api("/me/photos/uploaded?fields=name,images,place,created_time", function(response) {
      if (response.error) {
        if (response.error.code == 190 && response.error.error_subcode == 463) {
          // access token has expired
          this.handleLogin();
          return;
        }
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

  handleLogout: function () {
    Parse.User.logOut();
    this.setState(this.getInitialState());
    this.componentDidMount();
  }
});

// Initialize Parse
Parse.initialize(
  "8hfjPYQvw0Ic9QeR2DoGGJAbzEzmHNhNbB8QHUVc",
  "UcHtbBOqB8bZLhnFs6edT5j8YzaK2ohSk5ISosBt"
);

window.fbAsyncInit = function() {
  Parse.FacebookUtils.init({ // this line replaces FB.init({
    appId: '1526300564323388', // Facebook App ID
    status: true,  // check Facebook Login status
    cookie: true,  // enable cookies to allow Parse to access the session
    xfbml: true,  // initialize Facebook social plugins on the page
    version: 'v2.5' // point to the latest Facebook Graph API version
  });

  // Run code after the Facebook SDK is loaded.
  render(<FrontPage/>, document.getElementById('main'));
};
