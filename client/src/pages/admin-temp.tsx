import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function AdminTempPage() {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Admin Dashboard (Temporary)</h1>
      <p className="text-xl">
        This is a temporary admin page while we fix structure issues with the full dashboard.
      </p>
      <div className="mt-4">
        <p>
          The admin dashboard is being updated to include livestream functionality with multi-platform support.
        </p>
        <ul className="list-disc ml-6 mt-4">
          <li>YouTube integration</li>
          <li>Twitch channel support</li>
          <li>Instagram livestreams</li>
          <li>Facebook videos</li>
          <li>TikTok content</li>
          <li>Custom streaming solutions</li>
        </ul>
      </div>
    </div>
  );
}