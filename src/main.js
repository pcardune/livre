/* globals FB */
import React from 'react';
import {render} from 'react-dom';
import Parse from 'parse';
import moment from 'moment';
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
      user: Parse.User.current(),
      loading: false
    };
  },

  loadUser: function(objectId) {
    this.setState({loading: true});
    var query = new Parse.Query(Parse.User);
    query.get(objectId, {
      success: user => this.setState({user, loading:false}),
      error: () => {}
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
      let photoById = new Map(
        cachedPhotos.map(p => [p.id, p])
      );
      let cachedPosts = this.state.user.get('cachedPosts') || [];
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
        {this.state.loading ? <ProgressBar active now={100} /> : null}
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
    this.setState({loading: true});
    var user = Parse.User.current();
    FB.api(
      "/me/photos/uploaded?fields=name,images,place,created_time",
      response => {
        this.setState({loading: false});
        if (response.error) {
          if (response.error.code == 190 && response.error.error_subcode == 463) {
            // access token has expired
            this.handleLogin();
            return;
          }
          alert(response.error.message);
          return;
        }
        user.set("cachedPhotos", response.data);
        this.setState({loading: true});
        FB.api(
          "me/posts?fields=attachments,type,description,message,caption,created_time,place",
          response => {
            this.setState({loading: false});
            if (response.error) {
              alert(response.error.message);
              return;
            }
            user.set("cachedPosts", response.data);
            this.setState({loading: true});
            user.save(null, {
              success: user => this.setState({user:user, loading:false})
            });
          }
        );
      });
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
