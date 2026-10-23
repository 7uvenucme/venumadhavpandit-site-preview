import React from 'react';
export const FileCard = ({ children }: any) => <div className="evp">{children}</div>;
export const Header = ({ title, fact, intro }: any) => <header className="evp-head"><h1>{title}</h1>{fact && <p className="evp-fact">{fact}</p>}{intro && <p>{intro}</p>}</header>;
export const Group = ({ label, children }: any) => <section className="evp-group"><h2>{label}</h2>{children}</section>;
export const Text = ({ children }: any) => <div>{children}</div>;
export const Paragraph = ({ children }: any) => <p>{children}</p>;
export const Closing = ({ children }: any) => <p className="evp-closing">{children}</p>;
