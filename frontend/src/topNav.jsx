import React from 'react';
import './TopNav.css';

function TopNav() {
    return (
        <nav className="top-nav">
            <div className="nav-logo">
                MyApp
            </div>

            <div className="nav-links">
                <a href="/">Home</a>
                <a href="/about">About</a>
                <a href="/projects">Projects</a>
                <a href="/contact">Contact</a>
            </div>
        </nav>
    );
}

export default TopNav;