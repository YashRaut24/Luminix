import "./ConnectCard.css";

function ConnectCard({ contact, darkMode }) {
    const profilePhoto = contact.profileImage 
        ? `http://localhost:9000${contact.profileImage}` 
        : "../src/images/profilelogo.png";
    
    const profileBackground = contact.profileBackground 
        ? `http://localhost:9000${contact.profileBackground}` 
        : "../src/images/profile-background.png";

    return (
        <div className="card-connect">
            <div className="card-top-connect">
                <img 
                    src={profileBackground} 
                    className="profile-background-connect-photo" 
                    alt="profile-background"
                    onError={(e) => {
                        e.target.src = "../src/images/profile-background.png";
                    }}
                />
                <img 
                    src={profilePhoto} 
                    className="profile-photo-connect" 
                    alt="profile-photo"
                    onError={(e) => {
                        e.target.src = "../src/images/profilelogo.png";
                    }}
                />
                <p>{contact.lumiTag}</p>
            </div>
            <div className="card-bottom-connect">
                <p className="name-connect">{contact.name}</p>
                {contact.role === "creators" && contact.creatorRole && (
                    <p className="creator-role-connect">{contact.creatorRole}</p>
                )}
                <p>{contact.mutuals}</p>
                <div className="message-follow-button-connect">
                    <button className="message-button-connect">Message</button>
                    <button className="follow">Follow</button>
                </div>
            </div>
        </div>
    );
}

export default ConnectCard;