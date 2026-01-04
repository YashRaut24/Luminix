import "./Connect.css"

function Connect(props){
    return <div className={props.darkMode? "dark-connect-container" : "connect-container"}>
        <div className="top-section-connect">
            <p className="card-connect-label">Emerging content creators</p>
            <div className="connect-card-container">
                <div className="card-connect">
                    <div className="card-top-connect">
                        <img src="../src/images/profile-background.png" className="profile-background-connect-photo" alt="profile-background"/>
                        <img src="../src/images/profilelogo.png" className="profile-photo-connect" alt="profile-photo"/>
                        <p>Lumi tag</p>
                    </div>
                    <div className="card-bottom-connect">
                        <p className="name-connect">Name</p>
                        <p className="creator-role-connect">Role</p>
                        <p>P1,P2P,P3.....3 more mutuals</p>

                        <div className="message-follow-button-connect">
                            <button className="message-button-connect">Message</button>
                            <button className="follow">Follow</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="middle-section-connect">
            <p className="card-connect-label">People you may know</p>
            <div className="connect-card-container">
                <div className="card-connect">
                    <div className="card-top-connect">
                        <img src="../src/images/profile-background.png" className="profile-background-connect-photo" alt="profile-background"/>
                        <img src="../src/images/profilelogo.png" className="profile-photo-connect" alt="profile-photo"/>
                        <p>Lumi tag</p>
                    </div>
                    <div className="card-bottom-connect">
                        <p className="name-connect">Name</p>
                        <p>P1,P2P,P3.....3 more mutuals</p>
                        <div className="message-follow-button-connect">
                            <button className="message-button-connect">Message</button>
                            <button className="follow">Follow</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="bottom-section-connect">
            <p className="card-connect-label">Follow more peoples</p>
            <div className="connect-card-container">
                <div className="card-connect">
                    <div className="card-top-connect">
                        <img src="../src/images/profile-background.png" className="profile-background-connect-photo" alt="profile-background"/>
                        <img src="../src/images/profilelogo.png" className="profile-photo-connect" alt="profile-photo"/>
                        <p>Lumi tag</p>
                    </div>
                    <div className="card-bottom-connect">
                        <p className="name-connect">Name</p>
                        <p>P1,P2P,P3.....3 more mutuals</p>
                        <div className="message-follow-button-connect">
                            <button className="message-button-connect">Message</button>
                            <button className="follow">Follow</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
}

export default Connect;