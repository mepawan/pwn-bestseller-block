import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls, RichText } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import AsyncSelect from 'react-select/async';
import placeholderImage from './images/placeholder.png';
import logo from './images/logo.svg';
import './style.css';

const BLOCK_STYLE = {
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px'
};

// Add custom styles for the AsyncSelect component
const customStyles = {
    control: (base) => ({
        ...base,
        minHeight: '40px',
        border: '1px solid #949494',
        borderRadius: '2px',
        boxShadow: 'none',
        '&:hover': {
            border: '1px solid #949494'
        }
    }),
    placeholder: (base) => ({
        ...base,
        color: '#1e1e1e'
    }),
    menu: (base) => ({
        ...base,
        zIndex: 9999
    })
};

const BookDisplay = ({ book, isEditor }) => {
    if (!book) return null;
    const authors = book.authors.slice(0, 2).map(author => author.authorDisplay).join(', ');
    const coverImage = book.coverUrls.medium.coverUrl || placeholderImage;
    const wrapperProps = isEditor ? {} : {
        href: `https://www.penguin.co.uk/books/${book.isbn}`,
        target: '_blank',
        rel: 'noopener noreferrer'
    };

    return (
        <>
        <div className="book-display">

            <a {...wrapperProps}>
                <img src={coverImage} alt={book.title} className="book-cover" />
            </a>
            <h3 className="book-title">{book.title}</h3>
            <p className="book-authors">{authors}</p>
            {book.series && (
                <a 
                    href={isEditor ? '#' : `https://www.penguin.co.uk/series/${book.series.seoFriendlyUrl}`}
                    className="series-link"
                >
                    {book.series.seriesName}
                </a>
            )}
            <a 
                href={isEditor ? '#' : `https://amazon.co.uk/${book.seoFriendlyUrl}`}
                className="buy-button"
                target="_blank"
                rel="noopener noreferrer"
            >
                BUY FROM AMAZON
            </a>
        </div>
        <div className='penguin-wrap'>
            <div className='penguin-logo' >
                <img src={logo} />
            </div>
        </div>
        </>
    );
};

registerBlockType('pwn-bestseller/bestseller-block', {
    title: 'Bestseller Display',
    icon: 'book-alt',
    category: 'widgets',
    attributes: {
        title: {
            type: 'string',
            default: 'Bestsellers'
        },
        selectedGenre: {
            type: 'string'
        },
        selectedBook: {
            type: 'object'
        }
    },

    edit: ({ attributes, setAttributes }) => {
        const [genres, setGenres] = useState([]);
        const blockProps = useBlockProps({ style: BLOCK_STYLE });
        const [loading, setLosing] = useState(false);

        const loadGenres = async (inputValue) => {
            try {
                const response = await apiFetch({ path: '/pwn/v1/genres' });
                //console.log('resp');
                //console.log(response.data.categories);
                const options = response.data.categories.map(cat => ({ //catUri
                    value: cat.catUri,
                    //value: cat.catId,
                    label: cat.menuText
                }));
                setGenres(options);
                return options.filter(option => 
                    option.label.toLowerCase().includes(inputValue.toLowerCase())
                );
            } catch (error) {
                console.error('Failed to load genres:', error);
                return [];
            }
        };

        const loadBestseller = async (genreId) => {
            setLosing(true);
            console.log('loading bestseller :',loading)
            try {
                    const response = await apiFetch({
                        path: `/pwn/v1/bestseller?genreId=${genreId}`
                    });
                    //console.log('resp2')
                    //console.log(response.data.works)
                    setAttributes({ selectedBook: response.data.works[0] });
                } catch (error) {
                    console.error('Failed to load bestseller:', error);
                } finally {
                    setLosing(false); // Set loading to false when the request finishes (either success or failure)
                }
        };

        useEffect(() => {
            if (attributes.selectedGenre) {
                loadBestseller(attributes.selectedGenre);
            }
        }, [attributes.selectedGenre]);

        useEffect(() => {
            loadGenres('');
        }, []);

        return (
            <div {...blockProps}>
                
                {!attributes.selectedGenre ? (
                    // Initial state with just genre selection
                    <div className="genre-selection-initial">
                        <h2>Choose a genre...</h2>
                        <div className="genre-select-wrapper">
                            <AsyncSelect
                                cacheOptions
                                defaultOptions
                                value={genres.find(g => g.value === attributes.selectedGenre)}
                                loadOptions={loadGenres}
                                onChange={(selected) => {
                                    setAttributes({ selectedGenre: selected.value });
                                }}
                                placeholder="Choose a genre..."
                                styles={customStyles}
                                className="genre-select"
                            />
                        </div>
                    </div>
                ) : (
                    // Show bestseller content after genre is selected
                    <>
                        <RichText
                            tagName="h2"
                            value={attributes.title}
                            onChange={(title) => setAttributes({ title })}
                            placeholder="Enter title..."
                        />
                        {loading && <div className='bestseller-loading' ><div className='loading-text'>Loading...</div></div>}
                        <BookDisplay 
                            book={attributes.selectedBook}
                            isEditor={true}
                        />
                    </>
                )}

                <InspectorControls>
                    <PanelBody title="Block Settings">
                        <AsyncSelect
                            cacheOptions
                            defaultOptions
                            value={genres.find(g => g.value === attributes.selectedGenre)}
                            loadOptions={loadGenres}
                            onChange={(selected) => {
                                setAttributes({ selectedGenre: selected.value });
                            }}
                            placeholder="Select genre..."
                            styles={customStyles}
                        />
                    </PanelBody>
                </InspectorControls>
            </div>
        );
    },

    save: ({ attributes }) => {
        const blockProps = useBlockProps.save({ style: BLOCK_STYLE });

        return (
            <div {...blockProps}>
                {attributes.selectedBook && (
                    <>
                        <RichText.Content
                            tagName="h2"
                            value={attributes.title}
                        />
                        <BookDisplay 
                            book={attributes.selectedBook}
                            isEditor={false}
                        />
                    </>
                )}
            </div>
        );
    }
});


/*
registerBlockType('pwn-bestseller/bestseller-block', {
    title: 'Bestseller Display',
    icon: 'book-alt',
    category: 'widgets',
    attributes: {
        title: {
            type: 'string',
            default: 'Bestsellers'
        },
        selectedGenre: {
            type: 'string'
        },
        selectedBook: {
            type: 'object'
        }
    },

    edit: ({ attributes, setAttributes }) => {
        const [genres, setGenres] = useState([]);
        const blockProps = useBlockProps({ style: BLOCK_STYLE });

        const loadGenres = async (inputValue) => {
            try {
                const response = await apiFetch({ path: '/pwn/v1/genres' });
                const options = response.data.categories.map(cat => ({
                    value: cat.catUri,
                    label: cat.menuText
                }));
                setGenres(options);
                return options.filter(option => 
                    option.label.toLowerCase().includes(inputValue.toLowerCase())
                );
            } catch (error) {
                console.error('Failed to load genres:', error);
                return [];
            }
        };

        const loadBestseller = async (genreId) => {
            try {
                const response = await apiFetch({
                    path: `/pwn/v1/bestseller?genreId=${genreId}`
                });
                setAttributes({ selectedBook: response.data.works[0] });
            } catch (error) {
                console.error('Failed to load bestseller:', error);
            }
        };

        useEffect(() => {
            if (attributes.selectedGenre) {
                loadBestseller(attributes.selectedGenre);
            }
        }, [attributes.selectedGenre]);

        // Load genres on initial render
        useEffect(() => {
            loadGenres('');
        }, []);

        return (
            <div {...blockProps}>
                <div className="genre-select-wrapper">
                    <AsyncSelect
                        cacheOptions
                        defaultOptions
                        value={genres.find(g => g.value === attributes.selectedGenre)}
                        loadOptions={loadGenres}
                        onChange={(selected) => {
                            setAttributes({ selectedGenre: selected.value });
                        }}
                        placeholder="Choose a genre..."
                        styles={customStyles}
                        className="genre-select"
                    />
                </div>

                <RichText
                    tagName="h2"
                    value={attributes.title}
                    onChange={(title) => setAttributes({ title })}
                    placeholder="Enter title..."
                />

                <BookDisplay 
                    book={attributes.selectedBook}
                    isEditor={true}
                />

                <InspectorControls>
                    <PanelBody title="Block Settings">
                        <AsyncSelect
                            cacheOptions
                            defaultOptions
                            value={genres.find(g => g.value === attributes.selectedGenre)}
                            loadOptions={loadGenres}
                            onChange={(selected) => {
                                setAttributes({ selectedGenre: selected.value });
                            }}
                            placeholder="Select genre..."
                            styles={customStyles}
                        />
                    </PanelBody>
                </InspectorControls>
            </div>
        );
    },

    save: ({ attributes }) => {
        const blockProps = useBlockProps.save({ style: BLOCK_STYLE });

        return (
            <div {...blockProps}>
                <RichText.Content
                    tagName="h2"
                    value={attributes.title}
                />

                <BookDisplay 
                    book={attributes.selectedBook}
                    isEditor={false}
                />
            </div>
        );
    }
}); */


