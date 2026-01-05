import "./Connect.css";
import { useEffect, useState } from "react";
import axios from "axios";
import ConnectCard from "./ConnectCard";

function Connect(props) {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const res = await axios.get(
                    "http://localhost:9000/contacts",
                    { withCredentials: true }
                );
                
                // Transform the data to include mutuals info
                const transformedContacts = res.data.map(contact => ({
                    ...contact,
                    lumiTag: contact.lumiTag || `@${contact.name.toLowerCase().replace(/\s+/g, '')}`,
                    mutuals: contact.followers?.length > 0 
                        ? `${contact.followers.length} mutual${contact.followers.length > 1 ? 's' : ''}`
                        : "No mutuals yet"
                }));
                
                setContacts(transformedContacts);
                setLoading(false);
            } catch (err) {
                console.log("Error fetching contacts:", err);
                setLoading(false);
            }
        };
        fetchContacts();
    }, []);

    const creators = contacts.filter(p => p.role === "creators");
    const knownPeople = contacts.filter(p => p.role === "knownPeople");
    const others = contacts.filter(p => p.role === "others");

    if (loading) {
        return (
            <div className={props.darkMode ? "dark-connect-container" : "connect-container"}>
                <p>Loading contacts...</p>
            </div>
        );
    }

    return (
        <div className={props.darkMode ? "dark-connect-container" : "connect-container"}>
            {creators.length > 0 && (
                <div className="top-section-connect">
                    <p className="card-connect-label">Emerging content creators</p>
                    <div className="connect-card-container">
                        {creators.map((contact) => (
                            <ConnectCard 
                                key={contact._id} 
                                contact={contact} 
                                darkMode={props.darkMode} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {knownPeople.length > 0 && (
                <div className="middle-section-connect">
                    <p className="card-connect-label">People you may know</p>
                    <div className="connect-card-container">
                        {knownPeople.map((contact) => (
                            <ConnectCard 
                                key={contact._id} 
                                contact={contact} 
                                darkMode={props.darkMode} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {others.length > 0 && (
                <div className="bottom-section-connect">
                    <p className="card-connect-label">Follow more peoples</p>
                    <div className="connect-card-container">
                        {others.map((contact) => (
                            <ConnectCard 
                                key={contact._id} 
                                contact={contact} 
                                darkMode={props.darkMode} 
                            />
                        ))}
                    </div>
                </div>
            )}

            {contacts.length === 0 && (
                <div className="no-contacts-message">
                    <p>No users found. Be the first to connect!</p>
                </div>
            )}
        </div>
    );
}

export default Connect;