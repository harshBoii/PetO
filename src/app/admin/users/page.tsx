
'use client'

import { useState, useEffect } from 'react';
import { collection, onSnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { PetLoader } from '@/components/pet-loader';


interface UserProfile extends DocumentData {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
    createdAt: Timestamp;
    isAdmin?: boolean;
}

export default function ManageUsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const usersCollection = collection(db, 'users');
        
        const unsubscribe = onSnapshot(usersCollection, (querySnapshot) => {
            const usersData = querySnapshot.docs.map(doc => ({
                ...doc.data(),
                uid: doc.id,
            })) as UserProfile[];
            setUsers(usersData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const formatDate = (timestamp: Timestamp) => {
        if (!timestamp || !timestamp.toDate) return 'N/A';
        try {
            return format(timestamp.toDate(), 'PPP');
        } catch (error) {
            return 'Invalid Date';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Users</CardTitle>
                <CardDescription>A list of all the users in your application.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <PetLoader />
                        <p className="text-muted-foreground">Loading Users...</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="hidden md:table-cell">Role</TableHead>
                                <TableHead className="hidden md:table-cell">Joined On</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.uid}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.photoURL} alt={user.displayName} />
                                                <AvatarFallback>{user.displayName?.charAt(0) || <User />}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{user.displayName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {user.isAdmin ? <Badge>Admin</Badge> : <Badge variant="secondary">User</Badge>}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{formatDate(user.createdAt)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                                <DropdownMenuItem>Suspend User</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
