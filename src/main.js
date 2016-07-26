/* globals FB */
import React from 'react';
import {render} from 'react-dom';
import moment from 'moment';
import firebase from 'firebase';
import {
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

firebase.initializeApp({
  apiKey: "AIzaSyDnI5EiHjDttpxWBCy-Pu_7bypBsBGqy5g",
  authDomain: "livre-abeec.firebaseapp.com",
  databaseURL: "https://livre-abeec.firebaseio.com",
  storageBucket: "",
});

var Souvenir = React.createClass({
  render() {
    return (
      <Row className="Souvenir">
        <Col md={8}>
          {this.props.souvenir.subattachments.data.map((attachment, index) => {
            if (attachment.type == 'photo') {
              return <Image key={index} src={attachment.media.image.src} rounded responsive/>;
            }
          })}
        </Col>
        <Col md={4}>
          <p>{this.props.souvenir.title}</p>
        </Col>
      </Row>
    );
  }
});

var LinkPost = React.createClass({
  render() {
    let post = this.props.post;
    let attachment = post.attachments.data[0];
    console.log("post", post);
    return (
      <Col md={12}>
        <div className="quoteBlock">
          <p className="caption">{post.message}</p>
          <div className="linkAttachment">
            <a href={attachment.url}>
              <img src={attachment.media.image.src} style={{maxWidth: '100px'}}/>
             {attachment.title}
            </a>
          </div>
          <div className="metadata">
            {post.place ?
             <div>
               <Glyphicon glyph="map-marker"/>
               <a target="_blank" href={"http://fb.com/"+post.place.id}>
                  {post.place.name}
               </a>
             </div>
             : null}
            <div>
              <Glyphicon glyph="time"/>
              {moment(post.created_time).format('MMM Do, YYYY')}
            </div>
          </div>
        </div>
      </Col>
    );
  }
});

var StatusPost = React.createClass({
  render() {
    let post = this.props.post;
    let attachments = null;
    if (post.attachments) {
      attachments = post.attachments.data.map((attachment, index) => {
        if (attachment.type == 'souvenir') {
          //return <Souvenir key={index} souvenir={attachment} />;
        }
        return null;
      });
    }
    return (
      <Col md={12}>
        <div className="quoteBlock">
          <p className="caption">{post.message}</p>
          {attachments}
          <div className="metadata">
            {post.place ?
             <div>
               <Glyphicon glyph="map-marker"/>
               <a target="_blank" href={"http://fb.com/"+post.place.id}>
                  {post.place.name}
               </a>
             </div>
             : null}
            <div>
              <Glyphicon glyph="time"/>
              {moment(post.created_time).format('MMM Do, YYYY')}
            </div>
          </div>
        </div>
      </Col>
    );
  }
});

var FrontPage = React.createClass({
  getInitialState: function() {
    return {
      cachedPhotos: [],
      cachedPosts: [],
      loadingPhotos: false,
      loadingPosts: false,
      syncing: false,
    };
  },

  isLoading() {
    return this.state.loadingPhotos || this.state.loadingPosts || this.state.syncing;
  },

  load: function() {
    this.setState({loadingPhotos: true, loadingPosts: true});
    firebase.database().ref('cachedPhotos').on('value', snapshot => {
      this.setState({
        cachedPhotos: snapshot.val() || [],
        loadingPhotos: false,
      });
    });
    firebase.database().ref('cachedPosts').on('value', snapshot => {
      this.setState({
        cachedPosts: snapshot.val() || [],
        loadingPosts: false,
      });
    });
  },

  componentDidMount: function() {
    this.load();
  },

  render: function () {
    var photoElements = null;
    let buttons = [];
    if (!this.isLoading()) {
      var cachedPhotos = this.state.cachedPhotos;
      let photoById = new Map(
        cachedPhotos.map(p => [p.id, p])
      );
      let cachedPosts = this.state.cachedPosts || [];
      cachedPosts.forEach(post => {
        if (post.attachments) {
          post.attachments.data.forEach(attachment => {
            if (attachment.target) {
              attachment.photo = photoById.get(attachment.target.id);
            }
            if (attachment.subattachments) {
              attachment.subattachments.data.forEach(subattachment => {
                if (subattachment.target) {
                  let photo = photoById.get(subattachment.target.id);
                  if (photo) {
                    subattachment.photo = photo;
                    subattachment.photo.place = post.place;
                    if (subattachment.description) {
                      subattachment.photo.name = subattachment.description;
                    } else {
                      subattachment.photo.name = post.message;
                    }
                    post.type = 'used_up';
                  }
                }
              });
            }
          });
        }
      });
      let posts = [...cachedPhotos, ...cachedPosts];
      posts.sort((a,b) => new Date(b.created_time) - new Date(a.created_time));
      if (posts) {
        photoElements = posts.map((post, index) => {
          if (post.type) {
            // it's from the list of posts!
            if (post.type == 'status') {
              return (
                <Row key={index} className="post status">
                  <StatusPost post={post} />
                </Row>
              );
            } else if (post.type == 'link') {
              return (
                <Row key={index} className="post link">
                  <LinkPost post={post} />
                </Row>
              );
            }
          } else {
            // it's from the list of photos!
            return (
              <Row key={index} className="post photo">
                <Col xs={12} md={8} className="image">
                  <a href={post.images[0].source} target="_blank">
                    <Image rounded responsive src={post.images[0].source}/>
                  </a>
                </Col>
                <Col xs={12} md={4} className="description">
                  <div className="quoteBlock">
                    {post.name?
                     <p className="caption">
                       {post.name}
                     </p> : null}
                    <div className="metadata">
                      {post.place ?
                       <div>
                         <Glyphicon glyph="map-marker"/>
                         <a target="_blank" href={"http://fb.com/"+post.place.id}>
                            {post.place.name}
                         </a>
                       </div>
                       : null}
                      <div>
                        <Glyphicon glyph="time"/>
                        {moment(post.created_time).format('MMM Do, YYYY')}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            );
          }
        });
      }

      if (firebase.auth().currentUser) {
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
        {this.isLoading() ? <ProgressBar active now={100} /> : null}
        {photoElements}
        <div className="footer">Created by Paul and Meghan</div>
      </Grid>
    );
  },

  handleLogin: function () {
    var provider = new firebase.auth.FacebookAuthProvider();
    provider.addScope('user_photos,user_posts');
    firebase.auth().signInWithPopup(provider).then(result => {
      console.log("fbAuthToken is", result.credential.accessToken);
      this.setState({
        fbAuthToken: result.credential.accessToken,
        user: result.user
      });
    }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      // ...
      console.log(error);
    });
  },

  handleSync: function () {
    this.setState({syncing: true});
    FB.api(
      "/me/photos/uploaded?fields=name,images,place,created_time",
      {access_token: this.state.fbAuthToken},
      response => {
        this.setState({syncing: false});
        if (response.error) {
          if (response.error.code == 190 && response.error.error_subcode == 463) {
            // access token has expired
            this.handleLogin();
            return;
          }
          alert(response.error.message);
          return;
        }
        firebase.database().ref('cachedPhotos').set(response.data);
        this.setState({syncing: true});
        FB.api(
          "me/posts?fields=attachments,type,description,message,caption,created_time,place",
          {access_token: this.state.fbAuthToken},
          response => {
            this.setState({syncing: false});
            if (response.error) {
              alert(response.error.message);
              return;
            }
            firebase.database().ref('cachedPosts').set(response.data);
          }
        );
      });
  },

  handleLogout: function () {
    firebase.auth().signOut();
    this.setState(this.getInitialState());
    this.componentDidMount();
  }
});

window.fbAsyncInit = function() {
  FB.init({
    appId: '1526300564323388', // Facebook App ID
    version: 'v2.5' // point to the latest Facebook Graph API version
  });

  // Run code after the Facebook SDK is loaded.
  render(<FrontPage/>, document.getElementById('main'));
};
