import React from "react";
import {ListGroup, ListGroupItem, Link} from "reactstrap";

const ExternalLink = ({href, children, className=""}: {href: string; children: any; className?: string}) => (
    // eslint-disable-next-line react/jsx-no-target-blank
    <a href={href} target="_blank" rel="noopener" className={className}>
        {children}
    </a>
);

export const ListGroupFooterBottom = () => (
    <div className='footer-links footer-bottom'>
        <ListGroup className='d-flex flex-wrap flex-row'>
            <ListGroupItem className='footer-bottom-info border-0 px-0 py-0 bg-transparent'>
                <p className='pt-2 mb-lg-0'>
                    All teaching materials on this site are licensed under the&nbsp;
                    <ExternalLink href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" className="d-inline text-dark font-weight-bold">
                        Open Government License
                    </ExternalLink>, unless otherwise noted.
                </p>
            </ListGroupItem>

            <ListGroupItem className='footer-bottom-logos border-0 px-0 py-0 pb-4 pb-md-1 bg-transparent d-flex justify-content-between'>
                <ExternalLink href="https://teachcomputing.org/">
                    <img src="/assets/logos/ncce.png" alt='NCCE link' className='logo-mr' height="57px" />
                </ExternalLink>
                <ExternalLink href="https://www.raspberrypi.org/">
                    <img src="/assets/logos/raspberry-pi.png" alt='Raspberry Pi link' className='logo-mr' height="57px" />
                </ExternalLink>
                <ExternalLink href="https://isaacphysics.org/">
                    <img src="/assets/logos/isaacphysics.png" alt='Issac link' className='logo-mr' height="57px" />
                </ExternalLink>
            </ListGroupItem>
        </ListGroup>
    </div>
);