import { STORAGE_KEYS } from "@/constants";
import { MiddlewareFactory } from "@/middleware";
import { NextRequest, NextResponse } from "next/server";

// Define route permissions mapping
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  // Dashboard permissions
  "": ["view_dashboard"],

  // User management permissions
  "/users": ["manage_users"],
  "/users/*": ["manage_users"],

  // Admin panel permissions
  "/admin": ["admin_access"],
  "/admin/*": ["admin_access"],

  // Invoice management permissions
  "/invoices": ["view_invoices"],
  "/invoices/*": ["view_invoices"],
  "/create-invoice": ["create_invoice"],
  "/edit-invoice/*": ["edit_invoice"],

  // Customer management permissions
  "/customers": ["view_customers"],
  "/customers/*": ["view_customers"],

  // Item management permissions
  "/items": ["view_items"],
  "/items/*": ["view_items"],

  // Settings permissions
  "/settings": ["manage_settings"],
  "/settings/*": ["manage_settings"],
};

// Function to get user permissions from the API
const getUserPermissions = async (username: string): Promise<string[]> => {
  try {
    // In a real implementation, you would call the API to get permissions
    // const response = await UserService.getUserPermissions(username);
    // return response?.permissions || [];
    
    // For demonstration purposes, return a default set of permissions
    // In a real implementation, you'd fetch from your backend
    return ["view_dashboard", "view_invoices", "view_customers"]; // default permissions
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return []; // Return empty permissions if there's an error
  }
};

// Function to check if user has required permissions
const hasPermission = (userPermissions: string[], requiredPermissions: string[]): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true; // If no specific permissions required, allow access
  }
  
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

const rbacMiddleware: MiddlewareFactory = () => {
  return async (request: NextRequest) => {
    const { pathname } = request.nextUrl;


    try {
      // Get user data from cookies or session
      const userData = request.cookies.get(STORAGE_KEYS.USER_DATA)?.value;
      let username = null;
      
      if (userData) {
        try {
          const parsedUserData = JSON.parse(decodeURIComponent(userData));
          username = parsedUserData.username || parsedUserData.email;
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }

      // If we can't determine the user, skip RBAC check
      if (!username) {
        return NextResponse.next();
      }

      // Get user permissions
      const userPermissions = await getUserPermissions(username);

      // Find permissions required for the current path
      let requiredPermissions: string[] = [];
      
      // Check for exact route match first
      if (ROUTE_PERMISSIONS[pathname]) {
        requiredPermissions = ROUTE_PERMISSIONS[pathname];
      } else {
        // Check for wildcard matches (e.g., /users/* for /users/123)
        const wildcardMatches = Object.entries(ROUTE_PERMISSIONS)
          .filter(([path, _]) => path.endsWith('/*') && pathname.startsWith(path.replace('/*', '/')))
          .map(([_, perms]) => perms);
        
        if (wildcardMatches.length > 0) {
          // Use permissions from the first matching wildcard route
          requiredPermissions = wildcardMatches[0];
        }
      }

      // Check if user has required permissions
      const hasAccess = hasPermission(userPermissions, requiredPermissions);

      if (!hasAccess) {
        // If user doesn't have permission, redirect to unauthorized page
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      // User has permission, continue to next middleware
      return NextResponse.next();
    } catch (error) {
      console.error("Error in RBAC middleware:", error);
      // On error, allow the request to continue to avoid blocking users
      return NextResponse.next();
    }
  };
};

export default rbacMiddleware;
