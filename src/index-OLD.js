import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, InspectorControls, RichText } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import AsyncSelect from 'react-select/async';
import placeholderImage from './images/placeholder.png';

const BLOCK_STYLE = {
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px'
};

const BookDisplay = ({ book, isEditor }) => {
    if (!book) return null;

    const authors = book.authors.slice(0, 2).map(author => author.name).join(', ');
    console.log('cover urls:',book.coverUrls.medium);
    const coverImage = book.coverUrls.medium.coverUrl || placeholderImage;//book.images?.[0]?.url || 'placeholder-image.jpg';
    console.log('cover image:',coverImage)

    const wrapperProps = isEditor ? {} : {
        href: `https://www.penguin.co.uk/books/${book.isbn}`,
        target: '_blank',
        rel: 'noopener noreferrer'
    };

    return (
        <div className="book-display">
            <a {...wrapperProps}>
                <img src={coverImage} alt={book.title} className="book-cover" />
            </a>
            <h3 className="book-title">{book.title}</h3>
            <p className="book-authors">{authors}</p>
            {book.series && (
                <a 
                    href={isEditor ? '#' : `https://www.penguin.co.uk/series/${book.series.id}`}
                    className="series-link"
                >
                    {book.series.name}
                </a>
            )}
            <a 
                href={isEditor ? '#' : `https://amazon.co.uk/dp/${book.isbn}`}
                className="buy-button"
                target="_blank"
                rel="noopener noreferrer"
            >
                BUY FROM AMAZON
            </a>
        </div>
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
            try {
                const response = await apiFetch({
                    path: `/pwn/v1/bestseller?genreId=${genreId}`
                });
                console.log('resp2')
                console.log(response.data.works)
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

        return (
            <div {...blockProps}>
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
                        />
                    </PanelBody>
                </InspectorControls>

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
});