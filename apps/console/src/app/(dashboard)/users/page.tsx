"use client"

import { useCallback } from "react"
import { CreateUserRequest, PERMISSIONS, UserListItem } from "@guidora/contracts"
import { StatCards } from "./components/stat-cards"
import { DataTable } from "./components/data-table"
import { useSession } from "@/lib/session"
import { hasPermission } from "@/lib/rbac"
import {
  useCreateUserMutation,
  useDisableUserMutation,
  useListUsersQuery,
} from "@/store/services/console-api"

interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  plan: string
  billing: string
  status: string
  joinedDate: string
  lastLogin: string
}

interface UserFormValues {
  name: string
  email: string
  role: string
  password: string
}

export default function UsersPage() {
  const { user: currentUser } = useSession()
  const { data: usersResponse, error, isFetching } = useListUsersQuery()
  const [createUser] = useCreateUserMutation()
  const [disableUser] = useDisableUserMutation()
  const canCreateUsers = hasPermission(currentUser?.permissions ?? [], PERMISSIONS.USERS_CREATE)
  const canUpdateUsers = hasPermission(currentUser?.permissions ?? [], PERMISSIONS.USERS_UPDATE)
  const canDisableUsers = hasPermission(currentUser?.permissions ?? [], PERMISSIONS.USERS_DISABLE)

  const generateAvatar = (name: string) => {
    const names = name.split(" ")
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const toTableUser = useCallback((user: UserListItem): User => ({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: generateAvatar(user.name),
    role: user.role.key,
    plan: "Guidora",
    billing: "Internal",
    status: user.status,
    joinedDate: user.joinedDate,
    lastLogin: user.lastLoginAt?.slice(0, 10) ?? "Never",
  }), [])

  const users = usersResponse?.items.map(toTableUser) ?? []

  const handleAddUser = async (userData: UserFormValues) => {
    const payload: CreateUserRequest = {
      name: userData.name,
      email: userData.email,
      roleKey: userData.role as CreateUserRequest["roleKey"],
      password: userData.password,
    }

    await createUser(payload).unwrap()
  }

  const handleDeleteUser = async (id: string) => {
    await disableUser(id).unwrap()
  }

  const handleEditUser = (user: User) => {
    // For now, just log the user to edit
    // In a real app, you'd open an edit dialog
    console.log("Edit user:", user)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6">
        <StatCards />
      </div>
      
      <div className="@container/main px-4 lg:px-6 mt-8 lg:mt-12">
        {isFetching ? <p className="text-sm text-muted-foreground">Loading users...</p> : null}
        {error ? <p className="text-sm text-destructive">Unable to load users</p> : null}
        <DataTable 
          users={users}
          onDeleteUser={handleDeleteUser}
          onEditUser={handleEditUser}
          onAddUser={handleAddUser}
          canCreateUsers={canCreateUsers}
          canUpdateUsers={canUpdateUsers}
          canDisableUsers={canDisableUsers}
        />
      </div>
    </div>
  )
}
