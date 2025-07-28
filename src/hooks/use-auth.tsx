
'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    profile: DocumentData | null;
    isLoading: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    isLoading: true,
    isAdmin: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<DocumentData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                
                // Set up a real-time listener for the user's profile
                const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const profileData = docSnap.data();
                        setProfile(profileData);
                        setIsAdmin(profileData?.isAdmin === true);
                        setUser(user); // Set user after profile is confirmed
                        setIsLoading(false);
                    } else {
                        // Profile doesn't exist, this handles first-time sign-ins via Google or if doc creation failed
                        const displayName = user.displayName || 'New User';
                        const photoURL = user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;
                        
                        const newProfileData = {
                            uid: user.uid,
                            displayName: displayName,
                            email: user.email,
                            photoURL: photoURL,
                            createdAt: serverTimestamp(),
                            isAdmin: false,
                        };

                        setDoc(userDocRef, newProfileData).then(() => {
                            // The onSnapshot listener will fire again with the new data
                            // No need to setIsLoading(false) here, snapshot will handle it
                        }).catch(e => {
                            console.error("Error creating user document:", e);
                            setIsLoading(false); // Stop loading on error
                        });
                    }
                }, (error) => {
                    console.error("Error in profile snapshot listener:", error);
                    setIsLoading(false);
                });

                return () => unsubscribeProfile();
            } else {
                setUser(null);
                setProfile(null);
                setIsAdmin(false);
                setIsLoading(false);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribeAuth();
    }, []);
    

    const value = { user, profile, isLoading, isAdmin };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
