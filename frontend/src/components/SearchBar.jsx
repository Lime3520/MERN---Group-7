import './searchBar.css';

function SearchBar() {
    return (
        <div className="search-bar">
            <input type="search" aria-label="Search" placeholder="Search" />
        </div>
    );
}

export default SearchBar;