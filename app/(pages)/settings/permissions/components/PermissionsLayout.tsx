"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/react";
import {
  UserGroupIcon,
  UserIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

import GroupsManager from "./GroupsManager/GroupsManager";
import UsersManager from "./UsersManager/UsersManager";
import PermissionsMatrix from "./PermissionsMatrix/PermissionsMatrix";

export default function PermissionsLayout() {
  const [selectedTab, setSelectedTab] = useState("groups");

  return (
    <div className="w-full">
      <Tabs
        aria-label="Permissions Management"
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        className="w-full"
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-gradient-to-r from-amber-600 to-amber-700",
          tab: "max-w-fit px-6 h-12",
          tabContent: "group-data-[selected=true]:text-amber-600",
        }}
      >
        <Tab
          key="groups"
          title={
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <UserGroupIcon className="w-5 h-5" />
              <span>المجموعات</span>
            </div>
          }
        >
          <GroupsManager />
        </Tab>
        <Tab
          key="users"
          title={
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <UserIcon className="w-5 h-5" />
              <span>المستخدمين</span>
            </div>
          }
        >
          <UsersManager />
        </Tab>
        <Tab
          key="matrix"
          title={
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <ShieldCheckIcon className="w-5 h-5" />
              <span>مصفوفة الصلاحيات</span>
            </div>
          }
        >
          <PermissionsMatrix />
        </Tab>
      </Tabs>
    </div>
  );
}

